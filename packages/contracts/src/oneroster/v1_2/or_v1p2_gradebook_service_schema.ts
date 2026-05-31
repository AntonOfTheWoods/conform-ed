import { z } from "zod";

import {
  AcadSessionGuidRefSchema,
  ClassGuidRefSchema,
  CourseGuidRefSchema,
  DateSchema,
  DateTimeSchema,
  EntityStatusSchema,
  extensibleEnum,
  guidReferenceSchema,
  MetadataSchema,
  OrgGuidRefSchema,
  SourcedIdSchema,
  strictObject,
  TrueFalseStringSchema,
  UserGuidRefSchema,
} from "./shared";

export const AssessmentLineItemGuidRefSchema = guidReferenceSchema("assessmentLineItem");
export const CategoryGuidRefSchema = guidReferenceSchema("category");
export const LineItemGuidRefSchema = guidReferenceSchema("lineItem");
export const ScoreScaleGuidRefSchema = guidReferenceSchema("scoreScale");

export const ScoreStatusSchema = extensibleEnum([
  "exempt",
  "fully graded",
  "not submitted",
  "partially graded",
  "submitted",
]);

export const LearningObjectiveSourceSchema = z.union([
  z.string().regex(/^\/(?!case$)(?!unknown$)[a-z0-9]+$/u),
  z.enum(["case", "unknown"]),
]);

export const LearningObjectiveResultsSchema = strictObject({
  learningObjectiveId: z.string(),
  score: z.number().optional(),
  textScore: z.string().optional(),
});

export const LearningObjectiveScoreSetSchema = strictObject({
  source: LearningObjectiveSourceSchema,
  learningObjectiveResults: z.array(LearningObjectiveResultsSchema).min(1),
});

export const LearningObjectiveSetSchema = strictObject({
  source: LearningObjectiveSourceSchema,
  learningObjectiveIds: z.array(z.string()).min(1),
});

export const CategorySchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  weight: z.number().optional(),
});

export const ScoreScaleValueSchema = strictObject({
  itemValueLHS: z.string(),
  itemValueRHS: z.string(),
});

export const ScoreScaleSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  type: z.string(),
  course: CourseGuidRefSchema.optional(),
  class: ClassGuidRefSchema,
  scoreScaleValue: z.array(ScoreScaleValueSchema).min(1),
});

export const LineItemSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  description: z.string().optional(),
  assignDate: DateTimeSchema,
  dueDate: DateTimeSchema,
  class: ClassGuidRefSchema,
  school: OrgGuidRefSchema,
  category: CategoryGuidRefSchema,
  gradingPeriod: AcadSessionGuidRefSchema.optional(),
  academicSession: AcadSessionGuidRefSchema.optional(),
  scoreScale: ScoreScaleGuidRefSchema.optional(),
  resultValueMin: z.number().optional(),
  resultValueMax: z.number().optional(),
  learningObjectiveSet: z.array(LearningObjectiveSetSchema).optional(),
});

export const ResultSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  lineItem: LineItemGuidRefSchema,
  student: UserGuidRefSchema,
  class: ClassGuidRefSchema.optional(),
  scoreScale: ScoreScaleGuidRefSchema.optional(),
  scoreStatus: ScoreStatusSchema,
  score: z.number().optional(),
  textScore: z.string().optional(),
  scoreDate: DateSchema,
  comment: z.string().optional(),
  learningObjectiveSet: z.array(LearningObjectiveScoreSetSchema).optional(),
  inProgress: TrueFalseStringSchema.optional(),
  incomplete: TrueFalseStringSchema.optional(),
  late: TrueFalseStringSchema.optional(),
  missing: TrueFalseStringSchema.optional(),
});

export const AssessmentLineItemSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  description: z.string().optional(),
  class: ClassGuidRefSchema.optional(),
  parentAssessmentLineItem: AssessmentLineItemGuidRefSchema.optional(),
  scoreScale: ScoreScaleGuidRefSchema.optional(),
  resultValueMin: z.number().optional(),
  resultValueMax: z.number().optional(),
  learningObjectiveSet: z.array(LearningObjectiveSetSchema).optional(),
});

export const AssessmentResultSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  assessmentLineItem: AssessmentLineItemGuidRefSchema,
  student: UserGuidRefSchema,
  score: z.number().optional(),
  textScore: z.string().optional(),
  scoreDate: DateSchema,
  scoreScale: ScoreScaleGuidRefSchema.optional(),
  scorePercentile: z.number().optional(),
  scoreStatus: ScoreStatusSchema,
  comment: z.string().optional(),
  learningObjectiveSet: z.array(LearningObjectiveScoreSetSchema).optional(),
  inProgress: TrueFalseStringSchema.optional(),
  incomplete: TrueFalseStringSchema.optional(),
  late: TrueFalseStringSchema.optional(),
  missing: TrueFalseStringSchema.optional(),
});

export const GuidPairSchema = strictObject({
  suppliedSourcedId: z.string(),
  allocatedSourcedId: z.string(),
});

export const CategorySetSchema = strictObject({
  categories: z.array(CategorySchema).optional(),
});

export const ScoreScaleSetSchema = strictObject({
  scoreScales: z.array(ScoreScaleSchema).optional(),
});

export const LineItemSetSchema = strictObject({
  lineItems: z.array(LineItemSchema).optional(),
});

export const ResultSetSchema = strictObject({
  results: z.array(ResultSchema).optional(),
});

export const AssessmentLineItemSetSchema = strictObject({
  assessmentLineItems: z.array(AssessmentLineItemSchema).optional(),
});

export const AssessmentResultSetSchema = strictObject({
  assessmentResults: z.array(AssessmentResultSchema).optional(),
});

export const GuidPairSetSchema = strictObject({
  sourcedIdPairs: z.array(GuidPairSchema).optional(),
});

export const SingleCategorySchema = strictObject({
  category: CategorySchema,
});

export const SingleScoreScaleSchema = strictObject({
  scoreScale: ScoreScaleSchema,
});

export const SingleLineItemSchema = strictObject({
  lineItem: LineItemSchema,
});

export const SingleResultSchema = strictObject({
  result: ResultSchema,
});

export const SingleAssessmentLineItemSchema = strictObject({
  assessmentLineItem: AssessmentLineItemSchema,
});

export const SingleAssessmentResultSchema = strictObject({
  assessmentResult: AssessmentResultSchema,
});
// Inferred types from exported Zod validators.
export type AssessmentLineItemGuidRef = z.infer<typeof AssessmentLineItemGuidRefSchema>;
export type CategoryGuidRef = z.infer<typeof CategoryGuidRefSchema>;
export type LineItemGuidRef = z.infer<typeof LineItemGuidRefSchema>;
export type ScoreScaleGuidRef = z.infer<typeof ScoreScaleGuidRefSchema>;
export type ScoreStatus = z.infer<typeof ScoreStatusSchema>;
export type LearningObjectiveSource = z.infer<typeof LearningObjectiveSourceSchema>;
export type LearningObjectiveResults = z.infer<typeof LearningObjectiveResultsSchema>;
export type LearningObjectiveScoreSet = z.infer<typeof LearningObjectiveScoreSetSchema>;
export type LearningObjectiveSet = z.infer<typeof LearningObjectiveSetSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type ScoreScaleValue = z.infer<typeof ScoreScaleValueSchema>;
export type ScoreScale = z.infer<typeof ScoreScaleSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type Result = z.infer<typeof ResultSchema>;
export type AssessmentLineItem = z.infer<typeof AssessmentLineItemSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
export type GuidPair = z.infer<typeof GuidPairSchema>;
export type CategorySet = z.infer<typeof CategorySetSchema>;
export type ScoreScaleSet = z.infer<typeof ScoreScaleSetSchema>;
export type LineItemSet = z.infer<typeof LineItemSetSchema>;
export type ResultSet = z.infer<typeof ResultSetSchema>;
export type AssessmentLineItemSet = z.infer<typeof AssessmentLineItemSetSchema>;
export type AssessmentResultSet = z.infer<typeof AssessmentResultSetSchema>;
export type GuidPairSet = z.infer<typeof GuidPairSetSchema>;
export type SingleCategory = z.infer<typeof SingleCategorySchema>;
export type SingleScoreScale = z.infer<typeof SingleScoreScaleSchema>;
export type SingleLineItem = z.infer<typeof SingleLineItemSchema>;
export type SingleResult = z.infer<typeof SingleResultSchema>;
export type SingleAssessmentLineItem = z.infer<typeof SingleAssessmentLineItemSchema>;
export type SingleAssessmentResult = z.infer<typeof SingleAssessmentResultSchema>;
