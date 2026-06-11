# Backlog

Ordered, intentionally short. An entry graduates to active work when a real
consumer needs it (named use case), not when it merely sounds useful. Decisions
already made live in `docs/adr/`; this file holds the agreed-but-not-started.

## Next

1. **`@conform-ed/pci-math-entry`** — reference PCI package: MathLive input +
   compute-engine checking. Response of record is a PCI JSON record
   `{ expression, verdict }` (client verdict advisory; platform re-score
   authoritative when present). Per-item checking mode: `equivalent`
   (symbolic + numeric-sampling fallback) or `literal` (canonical structural),
   plus numeric tolerance. Ships a pure, framework-free checker subpath for
   server-side re-scoring; no server adapters. Reference-grade leaf package —
   core packages never depend on it. Dogfoods the PCI host and the
   customOperator seam end to end.

## Mid-term

2. **Hash-pinned PCI module catalog** (ADR-0007) — platform-authoritative
   `{ module id → url + integrity }` entries as a policy wrapper over the
   registry's `load(id, candidates)`/`fetchText` seam. Graduates when a
   consumer needs to deliver PCI content it didn't install.
3. **PCI `getState` persistence** — thread PCI state through the session
   model so suspend/resume restores in-progress custom interactions.
4. **Review-mode semantics** — enforce `allowReview`/`showSolution`/
   `showFeedback` from itemSessionControl in delivery chrome.
5. **Package/manifest loading** — `imsmanifest.xml` → resolve items, assets,
   and PCI module declarations from a QTI package zip (CC 1.4 embeds QTI 3
   packages as resources, so this is also the Common Cartridge entry point).

## Elsewhere

- Server-side evaluation platform (wasm/SpinKube execution of received code,
  async external-scored pipeline) is an **emergent** track, not conform-ed:
  the standard's only hook is `external-scored` outcomes, which conform-ed
  already represents. Isolation principle agreed: wasm sandbox for executing
  received code; trusted libraries over untrusted data stay in-process.
