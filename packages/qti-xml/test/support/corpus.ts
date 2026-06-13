/**
 * Corpus resolution for the qti-xml test suites.
 *
 * The official 1EdTech qti-examples corpus is resolved from the QTI_CORPUS_DIR env var
 * (default: <repo>/tmp/qti-examples, gitignored). If that directory holds no corpus,
 * ensureCorpus() clones the pinned upstream revision via scripts/fetch-qti-corpus.ts —
 * so the corpus suites run anywhere (CI included, where the job is already a container)
 * without a manual fetch step or a separate container. A machine with no corpus and no
 * network degrades to a graceful skip (hasCorpus() stays false) instead of crashing.
 *
 * ensureCorpus() runs once via the bunfig test preload (test/support/corpus-preload.ts),
 * before any test file loads, so the synchronous hasCorpus() guards in the suites see an
 * accurate answer at collection time.
 */

import { existsSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../../../..");
const fetchScript = path.join(repoRoot, "scripts/fetch-qti-corpus.ts");

export const corpusRoot = process.env["QTI_CORPUS_DIR"]
  ? path.resolve(process.env["QTI_CORPUS_DIR"])
  : path.join(repoRoot, "tmp/qti-examples");

/** True when the resolved directory actually holds the corpus (not just an empty dir). */
export function hasCorpus(): boolean {
  return existsSync(path.join(corpusRoot, "qtiv3-examples"));
}

let ensurePromise: Promise<boolean> | undefined;

/**
 * Make the corpus available at corpusRoot, cloning the pinned upstream revision when the
 * directory is empty or absent. Idempotent and memoised; resolves to whether the corpus
 * is present afterwards. Clone failures (e.g. offline) are swallowed so the corpus suites
 * skip gracefully rather than erroring.
 */
export function ensureCorpus(): Promise<boolean> {
  ensurePromise ??= (async () => {
    if (hasCorpus()) {
      return true;
    }

    try {
      const proc = Bun.spawnSync(["bun", fetchScript, "--root", corpusRoot], {
        stdout: "inherit",
        stderr: "inherit",
      });
      if (proc.exitCode !== 0) {
        console.warn(`[qti-xml] corpus fetch exited ${proc.exitCode}; corpus suites will skip.`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[qti-xml] corpus fetch failed (${reason}); corpus suites will skip.`);
    }

    return hasCorpus();
  })();

  return ensurePromise;
}
