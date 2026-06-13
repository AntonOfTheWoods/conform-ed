/**
 * Bun test preload: make the corpus available before any test file loads, so the
 * synchronous hasCorpus() guards in the corpus suites are accurate at collection time.
 * See test/support/corpus.ts and bunfig.toml.
 */

import { ensureCorpus } from "./corpus";

await ensureCorpus();
