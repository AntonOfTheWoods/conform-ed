import { z } from "zod";

import { XmlExtensionNodeListSchema, addIssue, strictObject } from "./shared";

const QtiPnpExtensionStringSchema = z.string().min(1);
const QtiPnpHexColorSchema = z.string().regex(/^#?[A-Fa-f0-9]{3,8}$/u);

export const QtiPnpReplaceAccessModeSchema = strictObject({
  replaceAccessModes: z
    .array(
      z.enum([
        "auditory",
        "color",
        "item-size",
        "olfactory",
        "orientation",
        "position",
        "tactile",
        "text-on-image",
        "textual",
        "visual",
      ]),
    )
    .optional(),
});

export const QtiPnpLanguageModeSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  xmlLang: z.string(),
});

export const QtiPnpAdditionalTestingTimeSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  timeMultiplier: z.number().optional(),
  fixedMinutes: z.number().int().optional(),
  unlimited: z.boolean().optional(),
}).superRefine((value, context) => {
  const provided = [
    value.timeMultiplier !== undefined,
    value.fixedMinutes !== undefined,
    value.unlimited === true,
  ].filter(Boolean).length;

  if (provided > 1) {
    addIssue(context, [], "Only one of timeMultiplier, fixedMinutes, or unlimited may be supplied.");
  }
});

export const QtiPnpBrailleSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  deliveryMode: z.enum(["refreshable", "embossed"]).optional(),
  grade: z.enum(["1", "2", "3"]).optional(),
  brailleType: QtiPnpExtensionStringSchema.optional(),
  mathType: QtiPnpExtensionStringSchema.optional(),
  xmlLang: z.string().optional(),
});

export const QtiPnpEnvironmentSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  description: z.string().optional(),
  medical: z.string().optional(),
  software: z.string().optional(),
  hardware: z.string().optional(),
  breaks: z.boolean().optional(),
});

export const QtiPnpFeatureNameSchema = z.enum([
  "linguistic-guidance",
  "keyword-emphasis",
  "keyword-translation",
  "simplified-language-portions",
  "simplified-graphics",
  "item-translation",
  "sign-language",
  "encouragement",
  "additional-testing-time",
  "line-reader",
  "invert-display-polarity",
  "magnification",
  "spoken",
  "tactile",
  "braille",
  "answer-masking",
  "keyboard-directions",
  "additional-directions",
  "long-description",
  "captions",
  "transcript",
  "alternative-text",
  "audio-description",
  "high-contrast",
  "input-requirements",
  "language-of-interface",
  "layout-single-column",
  "text-appearance",
  "calculator-on-screen",
  "dictionary-on-screen",
  "glossary-on-screen",
  "thesaurus-on-screen",
  "homophone-checker-on-screen",
  "note-taking-on-screen",
  "visual-organizer-on-screen",
  "outliner-on-screen",
  "peer-interaction-on-screen",
  "spell-checker-on-screen",
]);

export const QtiPnpFeatureSetSchema = strictObject({
  features: z.array(QtiPnpFeatureNameSchema).optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const QtiPnpFontFaceSchema = strictObject({
  fontName: z.array(z.string()).optional(),
  genericFontFace: z.enum(["serif", "sans serif", "monospaced", "cursive", "fantasy"]).optional(),
});

export const QtiPnpInvertDisplayPolaritySchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  foreground: QtiPnpHexColorSchema.optional(),
  background: QtiPnpHexColorSchema.optional(),
});

export const QtiPnpLineReaderSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  highlightColor: QtiPnpHexColorSchema.optional(),
});

export const QtiPnpLongDescriptionSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  hideVisually: z.boolean().optional(),
});

export const QtiPnpZoomAmountSchema = strictObject({
  zoomAmount: z.number().optional(),
});

export const QtiPnpMagnificationSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  allContent: QtiPnpZoomAmountSchema.optional(),
  text: QtiPnpZoomAmountSchema.optional(),
  nonText: QtiPnpZoomAmountSchema.optional(),
}).superRefine((value, context) => {
  if (value.allContent && (value.text || value.nonText)) {
    addIssue(context, ["allContent"], "allContent cannot be combined with text/nonText magnification settings.");
  }
});

export const QtiPnpSpokenSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  readingType: z.enum(["screen-reader", "computer-read-aloud"]).optional(),
  restrictionTypes: z.array(QtiPnpExtensionStringSchema).optional(),
  speechRate: z.number().int().optional(),
  pitch: z.number().optional(),
  volume: z.number().optional(),
  linkIndication: z.enum(["speak-link", "different-voice", "sound-effect", "none"]).optional(),
  typingEcho: z.enum(["characters", "words", "characters-and-words", "none"]).optional(),
});

export const QtiPnpTextAppearanceSchema = strictObject({
  ...QtiPnpReplaceAccessModeSchema.shape,
  backgroundColor: QtiPnpHexColorSchema.optional(),
  fontColor: QtiPnpHexColorSchema.optional(),
  fontSize: z.number().optional(),
  fontFace: QtiPnpFontFaceSchema.optional(),
  lineSpacing: z.number().optional(),
  lineHeight: z.number().optional(),
  letterSpacing: z.number().optional(),
  uniformFontSizing: z.boolean().optional(),
  wordSpacing: z.number().optional(),
  wordWrapping: z.boolean().optional(),
});

export const QtiPnpCalculatorSchema = strictObject({
  calculatorType: QtiPnpExtensionStringSchema.optional(),
});

export const QtiPnpPersonSourcedIdSchema = strictObject({
  value: z.string(),
  sourceSystem: z.string(),
});

export const QtiAccessForAllPnpSchema = strictObject({
  hazardAvoidance: z.array(QtiPnpExtensionStringSchema).optional(),
  inputRequirements: QtiPnpExtensionStringSchema.optional(),
  languageOfInterface: z.array(QtiPnpLanguageModeSchema).optional(),
  linguisticGuidance: QtiPnpReplaceAccessModeSchema.optional(),
  keywordEmphasis: QtiPnpReplaceAccessModeSchema.optional(),
  keywordTranslation: QtiPnpLanguageModeSchema.optional(),
  simplifiedLanguagePortions: QtiPnpReplaceAccessModeSchema.optional(),
  simplifiedGraphics: QtiPnpReplaceAccessModeSchema.optional(),
  itemTranslation: QtiPnpLanguageModeSchema.optional(),
  signLanguage: QtiPnpLanguageModeSchema.optional(),
  encouragement: QtiPnpReplaceAccessModeSchema.optional(),
  additionalTestingTime: QtiPnpAdditionalTestingTimeSchema.optional(),
  lineReader: QtiPnpLineReaderSchema.optional(),
  invertDisplayPolarity: QtiPnpInvertDisplayPolaritySchema.optional(),
  magnification: QtiPnpMagnificationSchema.optional(),
  spoken: QtiPnpSpokenSchema.optional(),
  tactile: QtiPnpReplaceAccessModeSchema.optional(),
  braille: QtiPnpBrailleSchema.optional(),
  answerMasking: QtiPnpReplaceAccessModeSchema.optional(),
  keyboardDirections: QtiPnpReplaceAccessModeSchema.optional(),
  additionalDirections: QtiPnpReplaceAccessModeSchema.optional(),
  longDescription: QtiPnpLongDescriptionSchema.optional(),
  captions: QtiPnpReplaceAccessModeSchema.optional(),
  environment: QtiPnpEnvironmentSchema.optional(),
  transcript: QtiPnpReplaceAccessModeSchema.optional(),
  alternativeText: QtiPnpReplaceAccessModeSchema.optional(),
  audioDescription: QtiPnpReplaceAccessModeSchema.optional(),
  highContrast: QtiPnpReplaceAccessModeSchema.optional(),
  layoutSingleColumn: QtiPnpReplaceAccessModeSchema.optional(),
  textAppearance: QtiPnpTextAppearanceSchema.optional(),
  calculatorOnScreen: QtiPnpCalculatorSchema.optional(),
  dictionaryOnScreen: z.boolean().optional(),
  glossaryOnScreen: z.boolean().optional(),
  thesaurusOnScreen: z.boolean().optional(),
  homophoneCheckerOnScreen: z.boolean().optional(),
  noteTakingOnScreen: z.boolean().optional(),
  visualOrganizerOnScreen: z.boolean().optional(),
  outlinerOnScreen: z.boolean().optional(),
  peerInteractionOnScreen: z.boolean().optional(),
  spellCheckerOnScreen: z.boolean().optional(),
  activateAtInitializationSet: QtiPnpFeatureSetSchema.optional(),
  activateAsOptionSet: QtiPnpFeatureSetSchema.optional(),
  prohibitSet: QtiPnpFeatureSetSchema.optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
});

export const QtiAccessForAllPnpRecordSchema = strictObject({
  personSourcedId: QtiPnpPersonSourcedIdSchema,
  appointmentId: z.array(z.string()).optional(),
  accessForAllPnp: QtiAccessForAllPnpSchema,
});

export const QtiAccessForAllPnpRecordsSchema = strictObject({
  records: z.array(QtiAccessForAllPnpRecordSchema).min(1),
});

export const QtiAccessForAllPnpDocumentSchema = strictObject({
  accessForAllPnp: QtiAccessForAllPnpSchema,
});

export const QtiAccessForAllPnpRecordsDocumentSchema = strictObject({
  accessForAllPnpRecords: QtiAccessForAllPnpRecordsSchema,
});
