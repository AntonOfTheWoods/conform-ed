export function getXapiReference(title: string): string {
  const matches = title.match(/\(([^)]+)\)/g);

  if (!matches || matches.length === 0) {
    return "";
  }

  const lastMatch = matches[matches.length - 1];
  if (!lastMatch) {
    return "";
  }
  return lastMatch.slice(1, -1);
}

export function generateXapiSpecURL(refId: string): string {
  let xapiUrl = "https://github.com/adlnet/xAPI-Spec/blob/1.0.3/xAPI-";

  const globalWithJquery = globalThis as typeof globalThis & {
    $?: {
      getJSON(url: string, callback: (references: Record<string, string>) => void): void;
    };
  };

  globalWithJquery.$?.getJSON("/references.json", (references) => {
    if (references[refId]) {
      xapiUrl += references[refId];
    } else {
      xapiUrl += "-About.md#partone";
    }

    console.log(xapiUrl);
  });

  return xapiUrl;
}

export default {
  generateXapiSpecURL,
  getXapiReference,
};
