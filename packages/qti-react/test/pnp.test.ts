/**
 * AfA PNP activation and catalog support matching. The catalog holds "support-specific
 * dormant content that can be made active … based on the candidate's PNP information
 * (or an assessment program's settings)" (§5.28); each card entry's attribute values
 * align "with a specific preference/need from the candidate's PNP" (§5.26.4), and "If
 * the CardEntry attribute values do not identify the proper content for a candidate,
 * use the content designated as default" (§5.27.2).
 */

import { describe, expect, test } from "bun:test";

import {
  assessmentItemViewFromNormalized,
  resolveCatalogSupports,
  resolvePnpActivation,
  stimulusContentFromNormalized,
  type CatalogView,
  type PnpView,
} from "../src";

describe("resolvePnpActivation", () => {
  test("activation sets split features into active, optional, and prohibited", () => {
    const activation = resolvePnpActivation({
      activateAtInitializationSet: { features: ["keyword-translation"] },
      activateAsOptionSet: { features: ["calculator-on-screen"] },
      prohibitSet: { features: ["spell-checker-on-screen"] },
    });

    expect(activation.active.has("keyword-translation")).toBe(true);
    expect(activation.optional.has("calculator-on-screen")).toBe(true);
    expect(activation.active.has("calculator-on-screen")).toBe(false);
    expect(activation.prohibited.has("spell-checker-on-screen")).toBe(true);
  });

  test("a stated preference outside any activation set is active at initialization", () => {
    // The PNP records the need; without an activation policy the natural reading is
    // to honor it from the start (designed policy, documented in the ADR).
    const activation = resolvePnpActivation({
      keywordTranslation: { xmlLang: "es" },
      glossaryOnScreen: true,
    });

    expect(activation.active.has("keyword-translation")).toBe(true);
    expect(activation.active.has("glossary-on-screen")).toBe(true);
  });

  test("prohibit-set wins over both activation sets and stated preferences", () => {
    const activation = resolvePnpActivation({
      spoken: { readingType: "computer-read-aloud" },
      activateAtInitializationSet: { features: ["spoken"] },
      prohibitSet: { features: ["spoken"] },
    });

    expect(activation.active.has("spoken")).toBe(false);
    expect(activation.prohibited.has("spoken")).toBe(true);
  });

  test("no PNP means nothing is active", () => {
    const activation = resolvePnpActivation(undefined);

    expect(activation.active.size).toBe(0);
    expect(activation.optional.size).toBe(0);
    expect(activation.prohibited.size).toBe(0);
  });
});

const keywordCatalog: CatalogView = {
  id: "catalog1",
  cards: [
    {
      support: "keyword-translation",
      cardEntries: [
        { xmlLang: "es", htmlContent: { content: [{ kind: "text", value: "preciso" }] } },
        { xmlLang: "de", htmlContent: { content: [{ kind: "text", value: "genau" }] } },
      ],
    },
    {
      support: "linguistic-guidance",
      htmlContent: { content: [{ kind: "text", value: "Accurate means correct." }] },
    },
  ],
};

describe("resolveCatalogSupports", () => {
  test("the entry whose language matches the PNP preference is selected", () => {
    const resolution = resolveCatalogSupports({
      catalogs: [keywordCatalog],
      pnp: { keywordTranslation: { xmlLang: "de" } },
    });

    const supports = resolution.byCatalogId.get("catalog1") ?? [];

    expect(supports).toHaveLength(1);
    expect(supports[0]?.support).toBe("keyword-translation");
    expect(supports[0]?.xmlLang).toBe("de");
    expect(supports[0]?.content).toEqual([{ kind: "text", value: "genau" }]);
  });

  test("language matching falls back to the primary subtag", () => {
    const resolution = resolveCatalogSupports({
      catalogs: [keywordCatalog],
      pnp: { keywordTranslation: { xmlLang: "es-MX" } },
    });

    expect(resolution.byCatalogId.get("catalog1")?.[0]?.xmlLang).toBe("es");
  });

  test("an unmatched preference falls back to the default entry, else nothing", () => {
    const catalog: CatalogView = {
      id: "c1",
      cards: [
        {
          support: "keyword-translation",
          cardEntries: [
            { xmlLang: "es", htmlContent: { content: [{ kind: "text", value: "preciso" }] } },
            { xmlLang: "en", default: true, htmlContent: { content: [{ kind: "text", value: "accurate" }] } },
          ],
        },
      ],
    };

    const fallback = resolveCatalogSupports({ catalogs: [catalog], pnp: { keywordTranslation: { xmlLang: "fr" } } });
    expect(fallback.byCatalogId.get("c1")?.[0]?.content).toEqual([{ kind: "text", value: "accurate" }]);

    const none = resolveCatalogSupports({ catalogs: [keywordCatalog], pnp: { keywordTranslation: { xmlLang: "fr" } } });
    expect(none.byCatalogId.get("catalog1") ?? []).toHaveLength(0);
  });

  test("data-* discriminators match against the camel-cased PNP preference field", () => {
    // The sharedStimulus exemplar shape: spoken entries keyed by data-reading-type.
    const catalog: CatalogView = {
      id: "content2",
      cards: [
        {
          support: "spoken",
          cardEntries: [
            {
              dataAttributes: { "reading-type": "computer-read-aloud" },
              htmlContent: { content: [{ kind: "text", value: "Read aloud text." }] },
            },
            { default: true, fileHrefs: [{ href: "audio/directions.mp3", mimeType: "audio/mpeg" }] },
          ],
        },
      ],
    };

    const matched = resolveCatalogSupports({
      catalogs: [catalog],
      pnp: { spoken: { readingType: "computer-read-aloud" } },
    });
    expect(matched.byCatalogId.get("content2")?.[0]?.content).toEqual([{ kind: "text", value: "Read aloud text." }]);

    const unmatched = resolveCatalogSupports({
      catalogs: [catalog],
      pnp: { spoken: { readingType: "screen-reader" } },
    });
    expect(unmatched.byCatalogId.get("content2")?.[0]?.fileHrefs).toEqual([
      { href: "audio/directions.mp3", mimeType: "audio/mpeg" },
    ]);
  });

  test("direct-content cards activate with their support, without entry selection", () => {
    const resolution = resolveCatalogSupports({
      catalogs: [keywordCatalog],
      pnp: { linguisticGuidance: {} } satisfies PnpView,
    });

    const supports = resolution.byCatalogId.get("catalog1") ?? [];

    expect(supports).toHaveLength(1);
    expect(supports[0]?.support).toBe("linguistic-guidance");
    expect(supports[0]?.content).toEqual([{ kind: "text", value: "Accurate means correct." }]);
  });

  test("activeSupports activates program-set supports, but never prohibited ones", () => {
    // "(or an assessment program's settings)" — §5.28. Prohibit still wins: the
    // prohibit-set names features that must not be offered.
    const withOverride = resolveCatalogSupports({
      catalogs: [keywordCatalog],
      pnp: { keywordTranslation: { xmlLang: "es" }, prohibitSet: { features: ["keyword-translation"] } },
      activeSupports: ["keyword-translation", "linguistic-guidance"],
    });

    const supports = withOverride.byCatalogId.get("catalog1") ?? [];

    expect(supports.map((entry) => entry.support)).toEqual(["linguistic-guidance"]);
  });
});

describe("catalog collection in the adapters", () => {
  test("item views collect catalogs from the item and from nested body nodes", () => {
    const view = assessmentItemViewFromNormalized({
      assessmentItem: {
        identifier: "item-1",
        title: "Catalogs",
        timeDependent: false,
        responseDeclarations: [{ identifier: "RESPONSE", cardinality: "single", baseType: "identifier" }],
        itemBody: {
          content: [
            {
              kind: "rubricBlock",
              view: ["candidate"],
              content: [{ kind: "xml", name: "p", attributes: { "data-catalog-idref": "rb_cat" }, children: ["Hi"] }],
              catalogInfo: {
                catalogs: [
                  {
                    id: "rb_cat",
                    cards: [
                      {
                        support: "keyword-translation",
                        cardEntries: [{ xmlLang: "es", htmlContent: { content: ["Hola"] } }],
                      },
                    ],
                  },
                ],
              },
            },
          ],
        },
        catalogInfo: {
          catalogs: [
            {
              id: "item_cat",
              cards: [{ support: "linguistic-guidance", htmlContent: { content: ["Guidance."] } }],
            },
          ],
        },
      },
    });

    expect(view?.catalogs?.map((catalog) => catalog.id).sort()).toEqual(["item_cat", "rb_cat"]);

    // Collected card content is renderer-ready: bare strings become text nodes.
    const rubricCatalog = view?.catalogs?.find((catalog) => catalog.id === "rb_cat");
    expect(rubricCatalog?.cards[0]?.cardEntries?.[0]?.htmlContent?.content).toEqual([{ kind: "text", value: "Hola" }]);
  });

  test("stimulus views collect their document-level catalogs", () => {
    const view = stimulusContentFromNormalized({
      assessmentStimulus: {
        identifier: "S1",
        title: "Passage",
        stimulusBody: { content: [{ kind: "xml", name: "p", children: ["Body"] }] },
        catalogInfo: {
          catalogs: [{ id: "s_cat", cards: [{ support: "braille", htmlContent: { content: ["Braille text."] } }] }],
        },
      },
    });

    expect(view?.catalogs?.map((catalog) => catalog.id)).toEqual(["s_cat"]);
  });
});

describe("companion materials exposure", () => {
  test("item views surface companionMaterialsInfo for the delivery platform", () => {
    const view = assessmentItemViewFromNormalized({
      assessmentItem: {
        identifier: "item-1",
        title: "Materials",
        timeDependent: false,
        responseDeclarations: [],
        itemBody: { content: [] },
        companionMaterialsInfo: {
          digitalMaterials: [{ label: "The Periodic Table", mimeType: "text/html", fileHref: "links/pt.xml" }],
          physicalMaterials: ["Graph paper"],
        },
      },
    });

    expect(view?.companionMaterials).toEqual({
      digitalMaterials: [{ label: "The Periodic Table", mimeType: "text/html", fileHref: "links/pt.xml" }],
      physicalMaterials: ["Graph paper"],
    });
  });
});
