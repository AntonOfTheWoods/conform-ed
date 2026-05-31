import { z } from "zod";

import { strictObject } from "../shared";

export const AccessibilityFeatureSchema = z.enum([
  "alternativeText",
  "annotations",
  "audioDescription",
  "bookmarks",
  "braille",
  "captions",
  "ChemML",
  "describedMath",
  "displayTransformability",
  "highContrastAudio",
  "highContrastDisplay",
  "index",
  "largePrint",
  "latex",
  "longDescription",
  "MathML",
  "none",
  "printPageNumbers",
  "readingOrder",
  "rubyAnnotations",
  "signLanguage",
  "structuralNavigation",
  "synchronizedAudioText",
  "tableOfContents",
  "taggedPDF",
  "tactileGraphic",
  "tactileObject",
  "timingControl",
  "transcript",
  "ttsMarkup",
  "unlocked",
]);

export const AccessibilityHazardSchema = z.enum([
  "flashing",
  "noFlashingHazard",
  "motionSimulation",
  "noMotionSimulationHazard",
  "sound",
  "noSoundHazard",
  "unknown",
  "none",
]);

export const AccessibilityApiSchema = z.enum([
  "AndroidAccessibility",
  "ARIA",
  "ATK",
  "AT-SPI",
  "BlackberryAccessibility",
  "iAccessible2",
  "iOSAccessibility",
  "JavaAccessibility",
  "MacOSXAccessibility",
  "MSAA",
  "UIAutomation",
]);

export const AccessibilityControlSchema = z.enum([
  "fullKeyboardControl",
  "fullMouseControl",
  "fullSwitchControl",
  "fullTouchControl",
  "fullVideoControl",
  "fullVoiceControl",
]);

export const AccessModeSchema = z.enum([
  "auditory",
  "chartOnVisual",
  "chemOnVisual",
  "colorDependent",
  "diagramOnVisual",
  "mathOnVisual",
  "musicOnVisual",
  "tactile",
  "textOnVisual",
  "textual",
  "visual",
]);

export const AccessModeSufficientSchema = z.enum(["auditory", "tactile", "textual", "visual"]);

export const ResourceAccessibilityMetadataSchema = strictObject({
  accessibilityFeature: z.array(AccessibilityFeatureSchema).optional(),
  accessibilityHazard: z.array(AccessibilityHazardSchema).optional(),
  accessibilityAPI: z.array(AccessibilityApiSchema).optional(),
  accessibilityControl: z.array(AccessibilityControlSchema).optional(),
  accessMode: z.array(AccessModeSchema).optional(),
  accessModeSufficient: z.array(AccessModeSufficientSchema).optional(),
  accessibilitySummary: z.array(z.string()).optional(),
});

export const ResourceAccessibilityMetadataDocumentSchema = strictObject({
  ResourceAccessibilityMetadata: ResourceAccessibilityMetadataSchema,
});
// Inferred types from exported Zod validators.
export type AccessibilityFeature = z.infer<typeof AccessibilityFeatureSchema>;
export type AccessibilityHazard = z.infer<typeof AccessibilityHazardSchema>;
export type AccessibilityApi = z.infer<typeof AccessibilityApiSchema>;
export type AccessibilityControl = z.infer<typeof AccessibilityControlSchema>;
export type AccessMode = z.infer<typeof AccessModeSchema>;
export type AccessModeSufficient = z.infer<typeof AccessModeSufficientSchema>;
export type ResourceAccessibilityMetadata = z.infer<typeof ResourceAccessibilityMetadataSchema>;
export type ResourceAccessibilityMetadataDocument = z.infer<typeof ResourceAccessibilityMetadataDocumentSchema>;
