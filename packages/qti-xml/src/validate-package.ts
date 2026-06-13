import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { unzipSync } from "fflate";

import type { QtiValidationIssue, QtiValidationResult } from "./types";
import { validateQtiXmlContent } from "./validate";

export interface QtiPackageValidationResult {
  packagePath: string;
  manifestPath?: string;
  status: "invalid" | "unsupported" | "valid";
  issues: QtiValidationIssue[];
  manifestValidation?: QtiValidationResult;
  referencedDocumentResults: QtiValidationResult[];
}

/** How the manifest and its referenced documents are read — from disk, or from a ZIP. */
interface PackageSource {
  /** The path reported as `packagePath` in the result. */
  readonly reportPath: string;
  /** The imsmanifest.xml content + the sourcePath xi:includes resolve against, or null. */
  readManifest(): Promise<{ xml: string; sourcePath: string } | null>;
  /** A referenced document's content, or null when the package omits it. */
  readReferenced(href: string): Promise<{ xml: string; sourcePath: string } | null>;
}

function prependIssues(prefix: string, issues: QtiValidationIssue[]): QtiValidationIssue[] {
  return issues.map((issue) => ({
    path: `${prefix}${issue.path === "$" ? "" : issue.path.slice(1)}`,
    message: issue.message,
  }));
}

function hasManifestShape(value: unknown): value is {
  manifest: {
    resources?: Array<{
      href?: string;
      files?: Array<{ href: string }>;
    }>;
  };
} {
  return Boolean(
    value &&
    typeof value === "object" &&
    "manifest" in value &&
    (value as { manifest?: unknown }).manifest &&
    typeof (value as { manifest?: unknown }).manifest === "object",
  );
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** The shared manifest + referenced-document validation, independent of the source. */
async function validatePackage(source: PackageSource): Promise<QtiPackageValidationResult> {
  const manifest = await source.readManifest();
  if (!manifest) {
    return {
      packagePath: source.reportPath,
      status: "unsupported",
      issues: [{ path: "$", message: "Package does not contain imsmanifest.xml at its root." }],
      referencedDocumentResults: [],
    };
  }

  const manifestValidation = await validateQtiXmlContent(manifest.xml, { sourcePath: manifest.sourcePath });
  const issues = prependIssues("$.manifest", manifestValidation.issues);

  if (manifestValidation.status !== "valid") {
    return {
      packagePath: source.reportPath,
      manifestPath: manifest.sourcePath,
      status: manifestValidation.status === "unsupported" ? "unsupported" : "invalid",
      issues,
      manifestValidation,
      referencedDocumentResults: [],
    };
  }

  if (!hasManifestShape(manifestValidation.normalizedDocument)) {
    return {
      packagePath: source.reportPath,
      manifestPath: manifest.sourcePath,
      status: "unsupported",
      issues: [{ path: "$.manifest", message: "Manifest normalized shape is not available for package validation." }],
      manifestValidation,
      referencedDocumentResults: [],
    };
  }

  const referencedXmlFiles = new Set<string>();

  for (const resource of manifestValidation.normalizedDocument.manifest.resources ?? []) {
    if (resource.href?.toLowerCase().endsWith(".xml")) {
      referencedXmlFiles.add(resource.href);
    }

    for (const file of resource.files ?? []) {
      if (file.href.toLowerCase().endsWith(".xml")) {
        referencedXmlFiles.add(file.href);
      }
    }
  }

  const referencedDocumentResults: QtiValidationResult[] = [];

  for (const relativeHref of [...referencedXmlFiles].sort()) {
    const referenced = await source.readReferenced(relativeHref);

    if (!referenced) {
      issues.push({
        path: "$.manifest.resources",
        message: `Referenced file is missing from the package: ${relativeHref}`,
      });
      continue;
    }

    const result = await validateQtiXmlContent(referenced.xml, { sourcePath: referenced.sourcePath });
    referencedDocumentResults.push(result);

    if (result.status !== "valid") {
      issues.push(
        ...prependIssues(
          `$.resources[${relativeHref}]`,
          result.issues.length
            ? result.issues
            : [{ path: "$", message: `Referenced XML validation status: ${result.status}` }],
        ),
      );
    }
  }

  return {
    packagePath: source.reportPath,
    manifestPath: manifest.sourcePath,
    status: issues.length === 0 ? "valid" : "invalid",
    issues,
    manifestValidation,
    referencedDocumentResults,
  };
}

function directorySource(directoryPath: string): PackageSource {
  const manifestPath = path.join(directoryPath, "imsmanifest.xml");
  return {
    reportPath: directoryPath,
    async readManifest() {
      if (!(await fileExists(manifestPath))) {
        return null;
      }
      return { xml: await readFile(manifestPath, "utf8"), sourcePath: manifestPath };
    },
    async readReferenced(href) {
      const absoluteHref = path.resolve(directoryPath, href);
      if (!(await fileExists(absoluteHref))) {
        return null;
      }
      return { xml: await readFile(absoluteHref, "utf8"), sourcePath: absoluteHref };
    },
  };
}

/** The first four bytes of every ZIP local-file/empty/spanned record ("PK"). */
function isZipArchive(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/** Normalize a manifest href to the forward-slash, no-"./" form ZIP entries use. */
function zipEntryKey(href: string): string {
  return href.replace(/\\/gu, "/").replace(/^\.\//u, "");
}

/**
 * Validate a QTI 3 content package supplied as PIF (Package Interchange Format) ZIP
 * bytes — the on-the-wire form of a package. Extraction is entirely in-memory; no
 * files are written to disk.
 *
 * xi:include across archive entries is not resolved here (the resolver reads from the
 * filesystem) — no PIF in the corpus relies on it; archive-internal includes would
 * surface as a loud failure on the including document, which is the honest read.
 */
export async function validateQtiPackageArchive(
  zipBytes: Uint8Array,
  options?: { readonly reportPath?: string },
): Promise<QtiPackageValidationResult> {
  const reportPath = options?.reportPath ?? "qti-package.zip";

  if (!isZipArchive(zipBytes)) {
    return {
      packagePath: reportPath,
      status: "unsupported",
      issues: [{ path: "$", message: "Package bytes are not a ZIP archive (missing the PK signature)." }],
      referencedDocumentResults: [],
    };
  }

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch (error) {
    return {
      packagePath: reportPath,
      status: "unsupported",
      issues: [
        {
          path: "$",
          message: `Could not read the ZIP archive: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      referencedDocumentResults: [],
    };
  }

  const decoder = new TextDecoder();
  const source: PackageSource = {
    reportPath,
    async readManifest() {
      const entry = entries["imsmanifest.xml"];
      return entry ? { xml: decoder.decode(entry), sourcePath: path.join(reportPath, "imsmanifest.xml") } : null;
    },
    async readReferenced(href) {
      const entry = entries[zipEntryKey(href)];
      return entry ? { xml: decoder.decode(entry), sourcePath: path.join(reportPath, href) } : null;
    },
  };

  return validatePackage(source);
}

/**
 * Validate a QTI 3 content package at a filesystem path: an exploded directory (with
 * full xi:include resolution from disk) or a PIF ZIP file (validated in-memory).
 */
export async function validateQtiPackagePath(packagePath: string): Promise<QtiPackageValidationResult> {
  const absolutePackagePath = path.resolve(packagePath);
  const pathStat = await stat(absolutePackagePath);

  if (pathStat.isDirectory()) {
    return validatePackage(directorySource(absolutePackagePath));
  }

  const zipBytes = new Uint8Array(await readFile(absolutePackagePath));
  return validateQtiPackageArchive(zipBytes, { reportPath: absolutePackagePath });
}
