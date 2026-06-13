/**
 * Bun test preload: make the official qti-examples corpus and the QTI 3 XSD schema set
 * available before any test file loads, so the synchronous hasCorpus()/hasQtiSchemas()
 * guards in the corpus and XSD-conformance lanes are accurate at collection time. Each
 * is cloned/fetched only when absent. See test/support/corpus.ts and test/support/qti-xsd.ts.
 */

import { ensureCorpus } from "./corpus";
import { ensureSchemas } from "./qti-xsd";

await Promise.all([ensureCorpus(), ensureSchemas()]);
