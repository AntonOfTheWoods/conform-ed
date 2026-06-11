# Backlog

Ordered, intentionally short. An entry graduates to active work when a real
consumer needs it (named use case), not when it merely sounds useful. Decisions
already made live in `docs/adr/`; this file holds the agreed-but-not-started.

## Shipped

- **`@conform-ed/pci-math-entry`** — the reference PCI (see its README):
  {expression, verdict} record contract, equivalent/literal modes + tolerance,
  pure checker subpath, org.conform-ed.mathEquivalent operator, MathLive
  module behind lazy import(), harness demo via the install model. Brought
  record responses + fieldValue into qti-react core on the way.

## Mid-term

1. **Hash-pinned PCI module catalog** (ADR-0007) — platform-authoritative
   `{ module id → url + integrity }` entries as a policy wrapper over the
   registry's `load(id, candidates)`/`fetchText` seam. Graduates when a
   consumer needs to deliver PCI content it didn't install.
2. **PCI `getState` persistence** — thread PCI state through the session
   model so suspend/resume restores in-progress custom interactions.
3. **Review-mode semantics** — enforce `allowReview`/`showSolution`/
   `showFeedback` from itemSessionControl in delivery chrome.
4. **Package/manifest loading** — `imsmanifest.xml` → resolve items, assets,
   and PCI module declarations from a QTI package zip (CC 1.4 embeds QTI 3
   packages as resources, so this is also the Common Cartridge entry point).

## Elsewhere

- Server-side evaluation platform (wasm/SpinKube execution of received code,
  async external-scored pipeline) is an **emergent** track, not conform-ed:
  the standard's only hook is `external-scored` outcomes, which conform-ed
  already represents. Isolation principle agreed: wasm sandbox for executing
  received code; trusted libraries over untrusted data stay in-process.
