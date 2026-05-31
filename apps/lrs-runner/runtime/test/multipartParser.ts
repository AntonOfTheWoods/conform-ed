type HeaderField = "contentType" | "boundary" | "contentTransferEncoding" | "contentDisposition" | "filename";

type MultipartHeader = {
  parts: string[];
  contentType?: string;
  boundary?: string;
  contentTransferEncoding?: string;
  contentDisposition?: string;
  filename?: string;
};

type MultipartPart = {
  header: MultipartHeader;
  body: string;
};

type HeaderMatcher = {
  field: HeaderField;
  fn: (part: string) => string | undefined;
};

function startsWith(value: unknown, prefix: string): boolean {
  return String(value).indexOf(prefix) === 0;
}

function contains(value: unknown, fragment: string): boolean {
  return String(value).indexOf(fragment) !== -1;
}

function isEmpty(value: unknown): boolean {
  return String(value).length === 0;
}

const headerParts: HeaderMatcher[] = [
  {
    field: "contentType",
    fn(part) {
      const lowerPart = part.toLowerCase();

      if (!startsWith(lowerPart, "content-type:")) {
        return undefined;
      }

      const type = part.substring("content-type:".length).trim();
      const matches = /\w+\/[\w.\-+]+/.exec(type);
      return Array.isArray(matches) ? matches[0] : undefined;
    },
  },
  {
    field: "boundary",
    fn(part) {
      if (!contains(part, "boundary=")) {
        return undefined;
      }

      const index = part.indexOf("boundary=");
      const indexSemicolon = part.indexOf(";", index);
      const endIndex = indexSemicolon < 0 ? part.length : indexSemicolon;
      let match = part.substring(index + "boundary=".length, endIndex);

      if (match.charAt(0) === '"') {
        match = match.substring(1, match.length - 1);
      }

      return match;
    },
  },
  {
    field: "contentTransferEncoding",
    fn(part) {
      const lowerPart = part.toLowerCase();

      if (!startsWith(lowerPart, "content-transfer-encoding:")) {
        return undefined;
      }

      return part.substring("content-transfer-encoding:".length).trim();
    },
  },
  {
    field: "contentDisposition",
    fn(part) {
      const lowerPart = part.toLowerCase();

      if (!startsWith(lowerPart, "content-disposition:")) {
        return undefined;
      }

      const type = part.substring("content-disposition:".length).trim();
      const matches = /\w+/.exec(type);
      return Array.isArray(matches) ? matches[0] : undefined;
    },
  },
  {
    field: "filename",
    fn(part) {
      const lowerPart = part.toLowerCase();

      if (!startsWith(lowerPart, "content-disposition:") || !contains(lowerPart, 'filename="')) {
        return undefined;
      }

      const index = lowerPart.indexOf('filename="');
      const filename = part.substring(index + 'filename="'.length);
      const matches = /[\w\W+\w+][^"]+/.exec(filename);
      return Array.isArray(matches) ? matches[0] : undefined;
    },
  },
];

function findDelimiter(content: string): string {
  if (startsWith(content, "\r\n")) {
    return "\r\n";
  }

  if (startsWith(content, "\r")) {
    return "\r";
  }

  if (startsWith(content, "\n")) {
    return "\n";
  }

  throw new Error("Multipart: unknown delimiter.");
}

function parseHeaderParts(header: MultipartHeader, part: string): void {
  headerParts.forEach((headerPart) => {
    const value = headerPart.fn(part);
    if (value) {
      header[headerPart.field] = value;
    }
  });
}

function parseHeader(delimiter: string, content: string): MultipartHeader {
  const parts = content.split(new RegExp(delimiter));
  const header: MultipartHeader = { parts: [] };

  if (parts.length < 2) {
    throw new Error("Multipart: cannot parse header with invalid length.");
  }

  if (!isEmpty(parts[0])) {
    throw new Error("Multipart: cannot parse header with invalid value.");
  }

  if (isEmpty(parts[0]) && isEmpty(parts[1])) {
    header.parts.push("Content-Type: text/plain");
    header.contentType = "text/plain";
    return header;
  }

  for (let index = 1; index < parts.length; index += 1) {
    const part = parts[index];
    if (typeof part === "undefined") {
      continue;
    }

    if (isEmpty(part)) {
      return header;
    }

    parseHeaderParts(header, part);
    header.parts.push(part);
  }

  return header;
}

function parsePart(delimiter: string, content: string): MultipartPart {
  const index = content.indexOf(delimiter + delimiter);

  return {
    header: parseHeader(delimiter, content),
    body: content.substring(index + delimiter.length * 2, content.length - delimiter.length),
  };
}

export function getBoundary(headerValue: string): string {
  let boundary = "";

  for (const headerPart of headerParts) {
    if (headerPart.field !== "boundary") {
      continue;
    }

    boundary = headerPart.fn(headerValue) ?? "";
    break;
  }

  return boundary;
}

export function parseMultipart(boundary: string, body: string): MultipartPart[] {
  const dashedBoundary = `--${boundary}`;
  const index = body.indexOf(dashedBoundary);

  if (index < 0) {
    throw new Error("Multipart: boundary not found.");
  }

  const delimiter = findDelimiter(body.substring(index + dashedBoundary.length));
  const contents = body.split(new RegExp(`--*${boundary}`));

  const parts: MultipartPart[] = [];
  let lastBoundary = false;

  for (let contentIndex = 1; contentIndex < contents.length; contentIndex += 1) {
    const content = contents[contentIndex];
    if (typeof content === "undefined") {
      continue;
    }

    if (startsWith(content, `--${delimiter}`) || startsWith(content, "--")) {
      lastBoundary = true;
    }

    if (!lastBoundary) {
      parts.push(parsePart(delimiter, content));
    }
  }

  return parts;
}

export default {
  getBoundary,
  parseMultipart,
};
