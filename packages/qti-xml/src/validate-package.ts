import { createReadStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { Unzip, UnzipInflate, unzipSync } from "fflate";

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

/** The first two bytes of every ZIP local-file/empty/spanned record ("PK"). */
function isZipArchive(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

/** Normalize a manifest href to the forward-slash, no-"./" form ZIP entries use. */
function zipEntryKey(href: string): string {
  return href.replace(/\\/gu, "/").replace(/^\.\//u, "");
}

/** Validation only ever needs the XML; media (the bulk of a package) is never inflated. */
function isXmlEntry(name: string): boolean {
  return name.toLowerCase().endsWith(".xml");
}

function concatChunks(chunks: readonly Uint8Array[]): Uint8Array {
  if (chunks.length === 1) {
    return chunks[0]!;
  }
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Stream a ZIP from disk and write only its `.xml` entries to `destDir`, preserving
 * relative structure. Memory stays bounded to roughly one entry plus stream buffers
 * regardless of total package size — media entries are skipped without inflation.
 * Guards against zip-slip (entry names escaping destDir).
 */
async function extractXmlEntriesToDir(zipPath: string, destDir: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const unzip = new Unzip();
    unzip.register(UnzipInflate);

    const writes: Array<Promise<void>> = [];
    let failed = false;
    const fail = (error: unknown): void => {
      if (!failed) {
        failed = true;
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    unzip.onfile = (file) => {
      if (!isXmlEntry(file.name)) {
        return; // not started → never decompressed
      }
      const chunks: Uint8Array[] = [];
      file.ondata = (error, chunk, final) => {
        if (error) {
          fail(error);
          return;
        }
        if (chunk.length) {
          chunks.push(chunk);
        }
        if (final) {
          const target = path.join(destDir, file.name);
          if (path.relative(destDir, target).startsWith("..")) {
            fail(new Error(`Unsafe archive entry path: ${file.name}`));
            return;
          }
          writes.push(
            mkdir(path.dirname(target), { recursive: true }).then(() => writeFile(target, concatChunks(chunks))),
          );
        }
      };
      file.start();
    };

    const stream = createReadStream(zipPath);
    stream.on("data", (chunk) => {
      if (failed) {
        return;
      }
      try {
        unzip.push(chunk as Uint8Array, false);
      } catch (error) {
        fail(error);
      }
    });
    stream.on("error", fail);
    stream.on("end", () => {
      if (failed) {
        return;
      }
      try {
        unzip.push(new Uint8Array(0), true);
      } catch (error) {
        fail(error);
        return;
      }
      Promise.all(writes)
        .then(() => resolve())
        .catch(fail);
    });
  });
}

function rebasePath(filePath: string | undefined, fromRoot: string, toRoot: string): string | undefined {
  if (filePath === undefined) {
    return undefined;
  }
  const relative = path.relative(fromRoot, filePath);
  return relative.startsWith("..") ? filePath : path.join(toRoot, relative);
}

/** Re-anchor reported paths from the ephemeral temp tree to the package's real path. */
function rebaseResult(
  result: QtiPackageValidationResult,
  fromRoot: string,
  toRoot: string,
): QtiPackageValidationResult {
  const manifestPath = rebasePath(result.manifestPath, fromRoot, toRoot);
  return {
    ...result,
    packagePath: toRoot,
    ...(manifestPath !== undefined ? { manifestPath } : {}),
    ...(result.manifestValidation
      ? {
          manifestValidation: {
            ...result.manifestValidation,
            filePath:
              rebasePath(result.manifestValidation.filePath, fromRoot, toRoot) ?? result.manifestValidation.filePath,
          },
        }
      : {}),
    referencedDocumentResults: result.referencedDocumentResults.map((document) => ({
      ...document,
      filePath: rebasePath(document.filePath, fromRoot, toRoot) ?? document.filePath,
    })),
  };
}

/**
 * Validate a QTI 3 content package held entirely in memory as PIF (Package Interchange
 * Format) ZIP bytes. Only `.xml` entries are decompressed (media is skipped), but the
 * caller's full byte buffer is still resident — suitable for modest packages and
 * callers that already hold the bytes (tests, small authored packages). For
 * potentially large packages prefer `validateQtiPackagePath`, which streams from disk.
 *
 * xi:include across archive entries is not resolved on this in-memory path (the
 * resolver reads from the filesystem); `validateQtiPackagePath` resolves them.
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
    entries = unzipSync(zipBytes, { filter: (file) => isXmlEntry(file.name) });
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
 * Validate a QTI 3 content package at a filesystem path: an exploded directory, or a
 * PIF ZIP file. The ZIP route streams from disk, materializing only the package's XML
 * into a temporary directory (media is never inflated, so memory stays bounded for
 * large packages), then validates the exploded tree — which also resolves xi:include
 * across entries — and cleans the temp directory up afterwards.
 */
export async function validateQtiPackagePath(packagePath: string): Promise<QtiPackageValidationResult> {
  const absolutePackagePath = path.resolve(packagePath);
  const pathStat = await stat(absolutePackagePath);

  if (pathStat.isDirectory()) {
    return validatePackage(directorySource(absolutePackagePath));
  }

  const tempRoot = await mkdtemp(path.join(tmpdir(), "qti-pif-"));
  try {
    try {
      await extractXmlEntriesToDir(absolutePackagePath, tempRoot);
    } catch (error) {
      return {
        packagePath: absolutePackagePath,
        status: "unsupported",
        issues: [
          {
            path: "$",
            message: `Could not read the package archive: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        referencedDocumentResults: [],
      };
    }

    const result = await validatePackage(directorySource(tempRoot));
    return rebaseResult(result, tempRoot, absolutePackagePath);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}
