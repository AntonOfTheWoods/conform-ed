import { access, stat } from "node:fs/promises";
import path from "node:path";

import type { QtiValidationIssue, QtiValidationResult } from "./types";
import { validateQtiXmlFile } from "./validate";

export interface QtiPackageValidationResult {
  packagePath: string;
  manifestPath?: string;
  status: "invalid" | "unsupported" | "valid";
  issues: QtiValidationIssue[];
  manifestValidation?: QtiValidationResult;
  referencedDocumentResults: QtiValidationResult[];
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

export async function validateQtiPackagePath(packagePath: string): Promise<QtiPackageValidationResult> {
  const absolutePackagePath = path.resolve(packagePath);
  const pathStat = await stat(absolutePackagePath);

  if (!pathStat.isDirectory()) {
    return {
      packagePath: absolutePackagePath,
      status: "unsupported",
      issues: [
        {
          path: "$",
          message: "ZIP package validation is not implemented yet; validate an exploded package directory instead.",
        },
      ],
      referencedDocumentResults: [],
    };
  }

  const manifestPath = path.join(absolutePackagePath, "imsmanifest.xml");
  if (!(await fileExists(manifestPath))) {
    return {
      packagePath: absolutePackagePath,
      manifestPath,
      status: "unsupported",
      issues: [{ path: "$", message: "Package directory does not contain imsmanifest.xml at its root." }],
      referencedDocumentResults: [],
    };
  }

  const manifestValidation = await validateQtiXmlFile(manifestPath);
  const issues = prependIssues("$.manifest", manifestValidation.issues);

  if (manifestValidation.status !== "valid") {
    return {
      packagePath: absolutePackagePath,
      manifestPath,
      status: manifestValidation.status === "unsupported" ? "unsupported" : "invalid",
      issues,
      manifestValidation,
      referencedDocumentResults: [],
    };
  }

  if (!hasManifestShape(manifestValidation.normalizedDocument)) {
    return {
      packagePath: absolutePackagePath,
      manifestPath,
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
    const absoluteHref = path.resolve(absolutePackagePath, relativeHref);

    if (!(await fileExists(absoluteHref))) {
      issues.push({
        path: "$.manifest.resources",
        message: `Referenced file is missing from the package directory: ${relativeHref}`,
      });
      continue;
    }

    const result = await validateQtiXmlFile(absoluteHref);
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
    packagePath: absolutePackagePath,
    manifestPath,
    status: issues.length === 0 ? "valid" : "invalid",
    issues,
    manifestValidation,
    referencedDocumentResults,
  };
}
