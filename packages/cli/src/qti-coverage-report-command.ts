import { qtiInventoryExamplesCommand } from "./qti-inventory-command";
import { qtiValidateFolderCommand } from "./qti-validate-folder-command";

export interface QtiCoverageIssueBucket {
  message: string;
  count: number;
}

export interface QtiCoverageSchemaBucket {
  schemaSelectionKey: string;
  total: number;
  valid: number;
  invalid: number;
  parseErrors: number;
  unsupported: number;
  topIssues: QtiCoverageIssueBucket[];
}

export interface QtiCoverageUnsupportedRootBucket {
  rootName: string;
  count: number;
}

export interface QtiCoverageReport {
  generatedAt: string;
  rootPath: string;
  inventorySummary: Awaited<ReturnType<typeof qtiInventoryExamplesCommand>>["summary"];
  validationSummary: Omit<Awaited<ReturnType<typeof qtiValidateFolderCommand>>, "results" | "rootPath">;
  bySchema: QtiCoverageSchemaBucket[];
  unsupportedRoots: QtiCoverageUnsupportedRootBucket[];
}

function incrementCount(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function qtiCoverageReportCommand(rootPath: string): Promise<QtiCoverageReport> {
  const inventory = await qtiInventoryExamplesCommand(rootPath);
  const validation = await qtiValidateFolderCommand(rootPath);
  const schemaBuckets = new Map<
    string,
    {
      total: number;
      valid: number;
      invalid: number;
      parseErrors: number;
      unsupported: number;
      issues: Map<string, number>;
    }
  >();
  const unsupportedRoots = new Map<string, number>();

  for (const result of validation.results) {
    const schemaSelectionKey = result.schemaSelectionKey ?? "unclassified";
    const bucket = schemaBuckets.get(schemaSelectionKey) ?? {
      total: 0,
      valid: 0,
      invalid: 0,
      parseErrors: 0,
      unsupported: 0,
      issues: new Map<string, number>(),
    };

    bucket.total += 1;

    switch (result.status) {
      case "valid":
        bucket.valid += 1;
        break;
      case "invalid":
        bucket.invalid += 1;
        break;
      case "parse-error":
        bucket.parseErrors += 1;
        break;
      case "unsupported":
        bucket.unsupported += 1;
        break;
    }

    for (const issue of result.issues) {
      incrementCount(bucket.issues, issue.message);
    }

    schemaBuckets.set(schemaSelectionKey, bucket);
  }

  for (const entry of inventory.entries) {
    if (entry.fileKind !== "xml" || entry.supportStatus === "supported") {
      continue;
    }

    incrementCount(unsupportedRoots, entry.rootName ?? "(unknown)");
  }

  return {
    generatedAt: new Date().toISOString(),
    rootPath: inventory.rootPath,
    inventorySummary: inventory.summary,
    validationSummary: {
      totalFiles: validation.totalFiles,
      validatedFiles: validation.validatedFiles,
      valid: validation.valid,
      invalid: validation.invalid,
      parseErrors: validation.parseErrors,
      unsupported: validation.unsupported,
      skipped: validation.skipped,
    },
    bySchema: [...schemaBuckets.entries()]
      .map(([schemaSelectionKey, bucket]) => ({
        schemaSelectionKey,
        total: bucket.total,
        valid: bucket.valid,
        invalid: bucket.invalid,
        parseErrors: bucket.parseErrors,
        unsupported: bucket.unsupported,
        topIssues: [...bucket.issues.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 5)
          .map(([message, count]) => ({ message, count })),
      }))
      .sort((left, right) => right.total - left.total),
    unsupportedRoots: [...unsupportedRoots.entries()]
      .map(([rootName, count]) => ({ rootName, count }))
      .sort((left, right) => right.count - left.count),
  };
}

export function formatQtiCoverageReport(report: QtiCoverageReport): string {
  const schemaLines = report.bySchema
    .map(
      (bucket) =>
        `${bucket.schemaSelectionKey}: total=${bucket.total}, valid=${bucket.valid}, invalid=${bucket.invalid}, parse-errors=${bucket.parseErrors}, unsupported=${bucket.unsupported}`,
    )
    .join("\n");

  return [
    `Coverage root: ${report.rootPath}`,
    `Inventory: files=${report.inventorySummary.totalFiles}, supported=${report.inventorySummary.bySupportStatus.supported}, unsupported-root=${report.inventorySummary.bySupportStatus["unsupported-root"]}, unsupported-normalization=${report.inventorySummary.bySupportStatus["unsupported-normalization"]}, known-broken=${report.inventorySummary.bySupportStatus["known-broken-example"]}`,
    `Validation: validated=${report.validationSummary.validatedFiles}, valid=${report.validationSummary.valid}, invalid=${report.validationSummary.invalid}, parse-errors=${report.validationSummary.parseErrors}, skipped=${report.validationSummary.skipped}`,
    schemaLines,
  ]
    .filter(Boolean)
    .join("\n");
}
