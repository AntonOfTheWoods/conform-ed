import { z } from "zod";

import {
  NonEmptyStringSchema,
  UriReferenceSchema,
  XmlExtensionNodeListSchema,
  addIssue,
  asArray,
  collectDuplicates,
  strictObject,
} from "../shared";

const OpenVideoExtensionStringSchema = z.string().regex(/^ext:[A-Za-z0-9._|-]+$/u);
const OpenVideoIpAddressSchema = z
  .string()
  .regex(/^(?:(?:1?\d?\d|2[0-4]\d|25[0-5])\.){3}(?:1?\d?\d|2[0-4]\d|25[0-5])$/u);
const OpenVideoChecksumSchema = z.string().regex(/^[a-fA-F0-9]{8}$/u);

export const OpenVideoContributorRoleSchema = z.union([
  z.enum([
    "guest",
    "faculty",
    "teachingassistant",
    "co-presenter",
    "audiencemember",
    "presenter",
    "moderator",
    "group",
    "organization",
  ]),
  OpenVideoExtensionStringSchema,
]);

export const OpenVideoRecordingAgentTypeSchema = z.union([
  z.enum(["Classroom Capture", "User Generated Content"]),
  OpenVideoExtensionStringSchema,
]);

export const OpenVideoOperatingSystemSchema = z.union([
  z.enum(["windows", "macos", "linux"]),
  OpenVideoExtensionStringSchema,
]);

export const OpenVideoRenditionTypeSchema = z.union([
  z.enum(["alternativeAudio", "alternativeBitrate", "audioDescription"]),
  OpenVideoExtensionStringSchema,
]);

export const OpenVideoStreamSourceSchema = z.union([
  z.enum(["presenter", "screen", "content", "other"]),
  OpenVideoExtensionStringSchema,
]);

export const OpenVideoAttachmentSchema = strictObject({
  url: UriReferenceSchema,
  mimeType: NonEmptyStringSchema,
  checksum: OpenVideoChecksumSchema.optional(),
});

export const OpenVideoCaptionsSchema = strictObject({
  file: OpenVideoAttachmentSchema,
  source: z.string().optional(),
  visible: z.boolean().optional(),
  description: z.string().optional(),
  xmlLang: z.string().optional(),
});

export const OpenVideoCaptureManifestSchema = strictObject({
  scheduledStartTime: z.string().optional(),
  scheduledDuration: z.number().int().optional(),
  recordingStartTime: z.string().optional(),
  recordingDuration: z.number().int().optional(),
  uploadedStartTime: z.string().optional(),
});

export const OpenVideoSocialMediaSchema = strictObject({
  value: UriReferenceSchema,
  smtype: NonEmptyStringSchema,
});

export const OpenVideoContactInfoSchema = strictObject({
  email: z.string().optional(),
  telephone: z.string().optional(),
  mobile: z.string().optional(),
  sms: z.string().optional(),
  address: z.string().optional(),
  socialmedia: z.array(OpenVideoSocialMediaSchema).optional(),
});

export const OpenVideoNameSchema = strictObject({
  givenName: z.string().optional(),
  familyName: z.string().optional(),
});

export const OpenVideoContributorSchema = strictObject({
  contributorID: NonEmptyStringSchema,
  role: OpenVideoContributorRoleSchema.optional(),
  name: OpenVideoNameSchema.optional(),
  title: z.string().optional(),
  link: UriReferenceSchema.optional(),
  bio: z.string().optional(),
  image: UriReferenceSchema.optional(),
  contactInformation: z.array(OpenVideoContactInfoSchema).optional(),
});

export const OpenVideoContributorsSchema = strictObject({
  contributor: z.array(OpenVideoContributorSchema).min(1),
});

export const OpenVideoCutSchema = strictObject({
  startTime: z.string(),
  duration: z.string(),
});

export const OpenVideoCutsSchema = strictObject({
  cut: z.array(OpenVideoCutSchema).min(1),
});

export const OpenVideoLayoutSchema = strictObject({
  posX: z.number().int(),
  posY: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
});

export const OpenVideoLocationSchema = strictObject({
  address: z.string(),
  room: z.string().optional(),
  buildingName: z.string().optional(),
});

export const OpenVideoMarkerBaseSchema = strictObject({
  title: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string(),
  userId: z.string().optional(),
});

export const OpenVideoDeckMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  file: OpenVideoAttachmentSchema,
  deckFileIndex: z.number().int().optional(),
  deckFile: OpenVideoAttachmentSchema.optional(),
});

export const OpenVideoFileMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  file: OpenVideoAttachmentSchema,
});

export const OpenVideoHighlightMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  duration: z.string().optional(),
  layout: OpenVideoLayoutSchema.optional(),
  style: z.string().optional(),
});

export const OpenVideoMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  type: z.string(),
  file: OpenVideoAttachmentSchema.optional(),
  duration: z.string().optional(),
  layout: OpenVideoLayoutSchema.optional(),
  style: z.string().optional(),
});

export const OpenVideoSpeakerMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  file: OpenVideoAttachmentSchema.optional(),
  duration: z.string().optional(),
  layout: OpenVideoLayoutSchema.optional(),
});

export const OpenVideoRelatedVideoMarkerSchema = OpenVideoMarkerBaseSchema.extend({
  file: OpenVideoAttachmentSchema,
  duration: z.string().optional(),
  layout: OpenVideoLayoutSchema.optional(),
  style: z.string().optional(),
});

export const OpenVideoMarkersSchema = strictObject({
  imageMarker: z.array(OpenVideoDeckMarkerSchema).optional(),
  confusionPointMarker: z.array(OpenVideoMarkerBaseSchema).optional(),
  bookMarker: z.array(OpenVideoFileMarkerSchema).optional(),
  chapterMarker: z.array(OpenVideoFileMarkerSchema).optional(),
  currentSpeakerMarker: z.array(OpenVideoSpeakerMarkerSchema).optional(),
  highlightMarker: z.array(OpenVideoHighlightMarkerSchema).optional(),
  noteMarker: z.array(OpenVideoFileMarkerSchema).optional(),
  relatedVideoMarker: z.array(OpenVideoRelatedVideoMarkerSchema).optional(),
  slideMarker: z.array(OpenVideoDeckMarkerSchema).optional(),
  marker: z.array(OpenVideoMarkerSchema).optional(),
});

export const OpenVideoRecordingAgentSchema = strictObject({
  agentID: NonEmptyStringSchema,
  recordingAgentType: OpenVideoRecordingAgentTypeSchema.optional(),
  name: z.string().optional(),
  vendor: NonEmptyStringSchema,
  product: NonEmptyStringSchema,
  version: NonEmptyStringSchema,
  isAppliance: z.boolean().optional(),
  ip: OpenVideoIpAddressSchema.optional(),
  os: OpenVideoOperatingSystemSchema.optional(),
  browser: z.string().optional(),
});

export const OpenVideoRecordingAgentsSchema = strictObject({
  recorder: z.array(OpenVideoRecordingAgentSchema).min(1),
});

export const OpenVideoRenditionSchema = strictObject({
  renditionType: OpenVideoRenditionTypeSchema,
  file: OpenVideoAttachmentSchema,
  bitrate: z.number().int().optional(),
  alternateLanguage: z.string().optional(),
});

export const OpenVideoStreamSchema = strictObject({
  title: z.string().optional(),
  startTime: z.string(),
  file: OpenVideoAttachmentSchema,
  bitrate: z.number().int().optional(),
  recorderID: z.string().optional(),
  rendition: z.array(OpenVideoRenditionSchema).optional(),
  cut: z.array(OpenVideoCutSchema).optional(),
  source: OpenVideoStreamSourceSchema,
  providesAudio: z.boolean(),
  captions: z.array(OpenVideoCaptionsSchema).optional(),
});

export const OpenVideoStreamsSchema = strictObject({
  stream: z.array(OpenVideoStreamSchema).min(1),
});

export const OpenVideoTagSchema = strictObject({
  name: z.string().optional(),
  value: z.string(),
});

export const OpenVideoTagsSchema = strictObject({
  tag: z.array(OpenVideoTagSchema).min(1),
});

export const OpenVideoThumbnailTimeSchema = strictObject({
  startTime: z.string(),
  sourceFile: OpenVideoAttachmentSchema,
});

export const OpenVideoSessionSchema = strictObject({
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  dateCreated: z.string().optional(),
  location: OpenVideoLocationSchema.optional(),
  captureManifest: OpenVideoCaptureManifestSchema.optional(),
  markers: OpenVideoMarkersSchema.optional(),
  streams: OpenVideoStreamsSchema.optional(),
  contributors: OpenVideoContributorsSchema.optional(),
  recorders: OpenVideoRecordingAgentsSchema.optional(),
  tags: OpenVideoTagsSchema.optional(),
  thumbnail: OpenVideoAttachmentSchema.optional(),
  thumbnailTime: OpenVideoThumbnailTimeSchema.optional(),
  copyright: z.string().optional(),
  license: z.string().optional(),
  credit: z.array(NonEmptyStringSchema).optional(),
  restrictions: z.string().optional(),
  attachments: z.array(OpenVideoAttachmentSchema).optional(),
  cuts: OpenVideoCutsSchema.optional(),
  extensions: XmlExtensionNodeListSchema.optional(),
}).superRefine((session, context) => {
  const contributorIds = asArray(session.contributors?.contributor).map((contributor) => contributor.contributorID);
  for (const duplicate of collectDuplicates(contributorIds)) {
    addIssue(context, ["contributors", "contributor"], `Duplicate contributorID in Open Video session: ${duplicate}`);
  }

  const recorderIds = asArray(session.recorders?.recorder).map((recorder) => recorder.agentID);
  for (const duplicate of collectDuplicates(recorderIds)) {
    addIssue(context, ["recorders", "recorder"], `Duplicate recorder agentID in Open Video session: ${duplicate}`);
  }

  const knownRecorderIds = new Set(recorderIds);
  asArray(session.streams?.stream).forEach((stream, streamIndex) => {
    if (stream.recorderID && !knownRecorderIds.has(stream.recorderID)) {
      addIssue(
        context,
        ["streams", "stream", streamIndex, "recorderID"],
        `Open Video stream recorderID ${stream.recorderID} does not match any recorder/@agentID.`,
      );
    }
  });
});

export const OpenVideoSessionDocumentSchema = strictObject({
  session: OpenVideoSessionSchema,
});
