import { Buffer } from "node:buffer";

import { newId, nowIso, saveImportedPackage } from "./cmi5-state";
import { jsonError, readNonEmptyString, readObjectBody } from "./route-utils";

const allowedMoveOnModes = new Set(["Passed", "Completed", "CompletedAndPassed", "CompletedOrPassed", "NotApplicable"]);

type PackageManifest = {
  identifier: string;
  title: string;
  version: string;
};

type PackageAu = {
  id: string;
  launchUrl: string;
  moveOn: string;
};

type ParsedPackage = {
  aus: PackageAu[];
  manifest: PackageManifest;
};

function isBase64Payload(value: string): boolean {
  return value.length > 0 && value.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/u.test(value);
}

/**
 * Pre-validation views of the adapter package-upload payload: declared names
 * are the protocol vocabulary, every field stays `unknown` until narrowed.
 */
type PackageUploadView = { manifest?: unknown; aus?: unknown; [key: string]: unknown };
type ManifestView = { identifier?: unknown; title?: unknown; version?: unknown; [key: string]: unknown };
type AuView = { id?: unknown; launchUrl?: unknown; moveOn?: unknown; [key: string]: unknown };

function asObject<View extends Record<string, unknown>>(value: unknown): View | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as View;
}

function readManifest(packageObject: PackageUploadView): PackageManifest | null {
  const manifestObject = asObject<ManifestView>(packageObject.manifest);
  if (!manifestObject) {
    return null;
  }

  const identifier = typeof manifestObject.identifier === "string" ? manifestObject.identifier.trim() : "";
  const title = typeof manifestObject.title === "string" ? manifestObject.title.trim() : "";
  const version = typeof manifestObject.version === "string" ? manifestObject.version.trim() : "";

  if (identifier.length === 0 || title.length === 0 || version.length === 0) {
    return null;
  }

  return { identifier, title, version };
}

function readAus(packageObject: PackageUploadView): PackageAu[] | null {
  const ausValue = packageObject.aus;
  if (!Array.isArray(ausValue) || ausValue.length === 0) {
    return null;
  }

  const parsedAus: PackageAu[] = [];
  const seenIds = new Set<string>();

  for (const auCandidate of ausValue) {
    const auObject = asObject<AuView>(auCandidate);
    if (!auObject) {
      return null;
    }

    const id = typeof auObject.id === "string" ? auObject.id.trim() : "";
    const launchUrl = typeof auObject.launchUrl === "string" ? auObject.launchUrl.trim() : "";
    const moveOn = typeof auObject.moveOn === "string" ? auObject.moveOn.trim() : "";

    if (id.length === 0 || launchUrl.length === 0 || moveOn.length === 0) {
      return null;
    }

    try {
      const parsedLaunchUrl = new URL(launchUrl);
      if (!parsedLaunchUrl.protocol.startsWith("http")) {
        return null;
      }
    } catch {
      return null;
    }

    if (!allowedMoveOnModes.has(moveOn) || seenIds.has(id)) {
      return null;
    }

    seenIds.add(id);
    parsedAus.push({ id, launchUrl, moveOn });
  }

  return parsedAus;
}

function parsePackageDefinition(packageBase64: string): ParsedPackage | null {
  let decodedJson = "";
  try {
    decodedJson = Buffer.from(packageBase64, "base64").toString("utf8");
  } catch {
    return null;
  }

  let decodedValue: unknown;
  try {
    decodedValue = JSON.parse(decodedJson);
  } catch {
    return null;
  }

  const packageObject = asObject(decodedValue);
  if (!packageObject) {
    return null;
  }

  const manifest = readManifest(packageObject);
  const aus = readAus(packageObject);
  if (!manifest || !aus) {
    return null;
  }

  return { manifest, aus };
}

export async function packageImportRoute(request: Request): Promise<Response> {
  const body = await readObjectBody(request);
  if (!body) {
    return jsonError(400, "invalid_payload", "Expected JSON object payload.");
  }

  const packageBase64 = readNonEmptyString(body, "packageBase64");
  if (!packageBase64 || !isBase64Payload(packageBase64)) {
    return jsonError(400, "invalid_package", "packageBase64 must be a non-empty base64 string.");
  }

  const parsedPackage = parsePackageDefinition(packageBase64);
  if (!parsedPackage) {
    return jsonError(
      400,
      "invalid_package_structure",
      "packageBase64 must decode to a JSON package with manifest and non-empty AU definitions.",
    );
  }

  const packageId = readNonEmptyString(body, "packageId") ?? newId("pkg");
  const byteLength = Buffer.from(packageBase64, "base64").byteLength;
  const importedAt = nowIso();

  saveImportedPackage({
    auCount: parsedPackage.aus.length,
    packageId,
    packageTitle: parsedPackage.manifest.title,
    manifestIdentifier: parsedPackage.manifest.identifier,
    manifestVersion: parsedPackage.manifest.version,
    byteLength,
    importedAt,
  });

  return Response.json({
    status: "ok",
    operation: "cmi5.package.import",
    packageId,
    manifestIdentifier: parsedPackage.manifest.identifier,
    manifestVersion: parsedPackage.manifest.version,
    packageTitle: parsedPackage.manifest.title,
    auCount: parsedPackage.aus.length,
    byteLength,
    importedAt,
  });
}
