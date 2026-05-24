import { z } from "zod";

import { UriReferenceSchema, addIssue, asArray, collectDuplicates, looseObject, strictObject } from "../shared";

export const VdexProfilesTypeSchema = z.enum([
  "lax",
  "hierarchicalTokenTerms",
  "flatTokenTerms",
  "glossaryOrDictionary",
  "thesaurus",
]);

export const VdexIdentifierSchema = looseObject({
  value: UriReferenceSchema,
});

export const VdexMediaLocatorSchema = looseObject({
  value: UriReferenceSchema,
});

export const VdexLangStringSchema = looseObject({
  value: z.string(),
  language: z.string().optional(),
});

export const VdexLangStringBagSchema = looseObject({
  langstring: z.array(VdexLangStringSchema).min(1),
});

export const VdexDescriptionSchema = VdexLangStringBagSchema;

export const VdexVocabSchema = looseObject({
  value: z.string(),
  source: UriReferenceSchema,
});

export const VdexMetadataSchema = looseObject({});

export const VdexMediaDescriptorSchema = looseObject({
  mediaLocator: VdexMediaLocatorSchema,
  interpretationNote: VdexDescriptionSchema.optional(),
});

export const VdexVocabIdentifierSchema = looseObject({
  value: UriReferenceSchema,
  isRegistered: z.boolean().optional(),
});

export const VdexTermRefSchema = looseObject({
  value: UriReferenceSchema,
  vocabularyIdentifier: UriReferenceSchema.optional(),
});

export const VdexTermSchema: z.ZodTypeAny = z.lazy(() =>
  looseObject({
    termIdentifier: VdexIdentifierSchema,
    caption: VdexLangStringBagSchema.optional(),
    description: VdexDescriptionSchema.optional(),
    mediaDescriptor: z.array(VdexMediaDescriptorSchema).optional(),
    metadata: z.array(VdexMetadataSchema).optional(),
    term: z.array(VdexTermSchema).optional(),
    orderSignificant: z.boolean().optional(),
    validIndex: z.boolean().optional(),
  }),
);

export const VdexRelationshipSchema = looseObject({
  relationshipIdentifier: VdexIdentifierSchema.optional(),
  sourceTerm: VdexTermRefSchema,
  targetTerm: VdexTermRefSchema,
  relationshipType: VdexVocabSchema.optional(),
  metadata: z.array(VdexMetadataSchema).optional(),
});

type VdexTermLike = {
  termIdentifier: { value: string };
  term?: VdexTermLike[];
};

function collectVdexTermIdentifiers(term: VdexTermLike, into: string[]) {
  into.push(term.termIdentifier.value);
  for (const child of asArray(term.term)) {
    collectVdexTermIdentifiers(child, into);
  }
}

export const VdexSchema = looseObject({
  vocabName: VdexLangStringBagSchema.optional(),
  vocabIdentifier: VdexVocabIdentifierSchema.optional(),
  term: z.array(VdexTermSchema).min(1),
  relationship: z.array(VdexRelationshipSchema).optional(),
  metadata: z.array(VdexMetadataSchema).optional(),
  orderSignificant: z.boolean().optional(),
  profileType: VdexProfilesTypeSchema.optional(),
  language: z.string().optional(),
}).superRefine((vdex, context) => {
  const termIdentifiers: string[] = [];
  for (const term of vdex.term) {
    collectVdexTermIdentifiers(term as VdexTermLike, termIdentifiers);
  }

  for (const duplicate of collectDuplicates(termIdentifiers)) {
    addIssue(context, ["term"], `Duplicate VDEX termIdentifier value: ${duplicate}`);
  }
});

export const VdexDocumentSchema = strictObject({
  vdex: VdexSchema,
});
