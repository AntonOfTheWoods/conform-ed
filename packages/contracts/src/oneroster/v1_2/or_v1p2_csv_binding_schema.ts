import { z } from "zod";

import { strictObject } from "./shared";

const CsvStringSchema = z.string();
const OptionalCsvStringSchema = z.string().optional();

const ManifestCsvRowBaseSchema = strictObject({
  "manifest.version": CsvStringSchema,
  "oneroster.version": CsvStringSchema,
  "file.academicSessions": CsvStringSchema,
  "file.categories": CsvStringSchema,
  "file.classes": CsvStringSchema,
  "file.classResources": CsvStringSchema,
  "file.courses": CsvStringSchema,
  "file.courseResources": CsvStringSchema,
  "file.demographics": CsvStringSchema,
  "file.enrollments": CsvStringSchema,
  "file.lineItems": CsvStringSchema,
  "file.orgs": CsvStringSchema,
  "file.resources": CsvStringSchema,
  "file.results": CsvStringSchema,
  "file.users": CsvStringSchema,
  "file.lineItemLearningObjectiveIds": OptionalCsvStringSchema,
  "file.lineItemLearningObjectiveIds*": OptionalCsvStringSchema,
  "file.lineItemScoreScales": OptionalCsvStringSchema,
  "file.lineItemScoreScales*": OptionalCsvStringSchema,
  "file.resultLearningObjectiveIds": OptionalCsvStringSchema,
  "file.resultLearningObjectiveIds*": OptionalCsvStringSchema,
  "file.resultScoreScales": OptionalCsvStringSchema,
  "file.resultScoreScales*": OptionalCsvStringSchema,
  "file.roles": OptionalCsvStringSchema,
  "file.roles*": OptionalCsvStringSchema,
  "file.scoreScales": OptionalCsvStringSchema,
  "file.scoreScales*": OptionalCsvStringSchema,
  "file.userProfiles": OptionalCsvStringSchema,
  "file.userProfiles*": OptionalCsvStringSchema,
  "file.userResources": OptionalCsvStringSchema,
  "file.userResources*": OptionalCsvStringSchema,
  "source.systemName": OptionalCsvStringSchema,
  "source.systemCode": OptionalCsvStringSchema,
});

const STAR_MANIFEST_KEYS = [
  ["file.lineItemLearningObjectiveIds", "file.lineItemLearningObjectiveIds*"],
  ["file.lineItemScoreScales", "file.lineItemScoreScales*"],
  ["file.resultLearningObjectiveIds", "file.resultLearningObjectiveIds*"],
  ["file.resultScoreScales", "file.resultScoreScales*"],
  ["file.roles", "file.roles*"],
  ["file.scoreScales", "file.scoreScales*"],
  ["file.userProfiles", "file.userProfiles*"],
  ["file.userResources", "file.userResources*"],
] as const;

export const ManifestCsvRowSchema = ManifestCsvRowBaseSchema.superRefine((value, ctx) => {
  for (const [plainKey, starredKey] of STAR_MANIFEST_KEYS) {
    if (value[plainKey] === undefined && value[starredKey] === undefined) {
      ctx.addIssue({
        code: "custom",
        path: [plainKey],
        message: `Expected either '${plainKey}' or '${starredKey}' column in manifest row`,
      });
    }
  }
});

export const AcademicSessionsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: CsvStringSchema,
  type: CsvStringSchema,
  startDate: CsvStringSchema,
  endDate: CsvStringSchema,
  parentSourcedId: OptionalCsvStringSchema,
  schoolYear: CsvStringSchema,
});

export const CategoriesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: CsvStringSchema,
  weight: OptionalCsvStringSchema,
});

export const ClassesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: CsvStringSchema,
  grades: OptionalCsvStringSchema,
  courseSourcedId: CsvStringSchema,
  classCode: OptionalCsvStringSchema,
  classType: CsvStringSchema,
  location: OptionalCsvStringSchema,
  schoolSourcedId: CsvStringSchema,
  termSourcedIds: CsvStringSchema,
  subjects: OptionalCsvStringSchema,
  subjectCodes: OptionalCsvStringSchema,
  periods: OptionalCsvStringSchema,
});

export const ClassResourcesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: OptionalCsvStringSchema,
  classSourcedId: CsvStringSchema,
  resourceSourcedId: CsvStringSchema,
});

export const CourseResourcesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: OptionalCsvStringSchema,
  courseSourcedId: CsvStringSchema,
  resourceSourcedId: CsvStringSchema,
});

export const CoursesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  schoolYearSourcedId: OptionalCsvStringSchema,
  title: CsvStringSchema,
  courseCode: OptionalCsvStringSchema,
  grades: OptionalCsvStringSchema,
  orgSourcedId: CsvStringSchema,
  subjects: OptionalCsvStringSchema,
  subjectCodes: OptionalCsvStringSchema,
});

export const DemographicsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  birthDate: OptionalCsvStringSchema,
  sex: OptionalCsvStringSchema,
  americanIndianOrAlaskaNative: OptionalCsvStringSchema,
  asian: OptionalCsvStringSchema,
  blackOrAfricanAmerican: OptionalCsvStringSchema,
  nativeHawaiianOrOtherPacificIslander: OptionalCsvStringSchema,
  white: OptionalCsvStringSchema,
  demographicRaceTwoOrMoreRaces: OptionalCsvStringSchema,
  hispanicOrLatinoEthnicity: OptionalCsvStringSchema,
  countryOfBirthCode: OptionalCsvStringSchema,
  stateOfBirthAbbreviation: OptionalCsvStringSchema,
  cityOfBirth: OptionalCsvStringSchema,
  publicSchoolResidenceStatus: OptionalCsvStringSchema,
});

export const EnrollmentsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  classSourcedId: CsvStringSchema,
  schoolSourcedId: CsvStringSchema,
  userSourcedId: CsvStringSchema,
  role: CsvStringSchema,
  primary: OptionalCsvStringSchema,
  beginDate: OptionalCsvStringSchema,
  endDate: OptionalCsvStringSchema,
});

export const LineItemLearningObjectiveIdsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  lineItemSourcedId: CsvStringSchema,
  source: CsvStringSchema,
  learningObjectiveId: CsvStringSchema,
});

export const LineItemsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: CsvStringSchema,
  description: OptionalCsvStringSchema,
  assignDate: CsvStringSchema,
  dueDate: CsvStringSchema,
  classSourcedId: CsvStringSchema,
  categorySourcedId: CsvStringSchema,
  academicSessionSourcedId: CsvStringSchema,
  resultValueMin: OptionalCsvStringSchema,
  resultValueMax: OptionalCsvStringSchema,
  schoolSourcedId: CsvStringSchema,
});

export const LineItemScoreScalesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: OptionalCsvStringSchema,
  lineItemSourcedId: CsvStringSchema,
  scoreScaleSourcedId: CsvStringSchema,
});

export const OrgsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  name: CsvStringSchema,
  type: CsvStringSchema,
  identifier: OptionalCsvStringSchema,
  parentSourcedId: OptionalCsvStringSchema,
});

export const ResourcesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  vendorResourceId: CsvStringSchema,
  title: OptionalCsvStringSchema,
  roles: OptionalCsvStringSchema,
  importance: OptionalCsvStringSchema,
  vendorId: OptionalCsvStringSchema,
  applicationId: OptionalCsvStringSchema,
});

export const ResultLearningObjectiveIdsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  resultSourcedId: CsvStringSchema,
  source: CsvStringSchema,
  learningObjectiveId: CsvStringSchema,
  score: OptionalCsvStringSchema,
  textScore: OptionalCsvStringSchema,
});

export const ResultsCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  lineItemSourcedId: CsvStringSchema,
  studentSourcedId: CsvStringSchema,
  scoreStatus: CsvStringSchema,
  score: OptionalCsvStringSchema,
  scoreDate: CsvStringSchema,
  comment: OptionalCsvStringSchema,
  textScore: OptionalCsvStringSchema,
  classSourcedId: OptionalCsvStringSchema,
  inProgress: OptionalCsvStringSchema,
  incomplete: OptionalCsvStringSchema,
  late: OptionalCsvStringSchema,
  missing: OptionalCsvStringSchema,
});

export const ResultScoreScalesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: OptionalCsvStringSchema,
  resultSourcedId: CsvStringSchema,
  scoreScaleSourcedId: CsvStringSchema,
});

export const RolesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  userSourcedId: CsvStringSchema,
  roleType: CsvStringSchema,
  role: CsvStringSchema,
  beginDate: OptionalCsvStringSchema,
  endDate: OptionalCsvStringSchema,
  orgSourcedId: CsvStringSchema,
  userProfileSourcedId: OptionalCsvStringSchema,
});

export const ScoreScalesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  title: CsvStringSchema,
  type: CsvStringSchema,
  orgSourcedId: CsvStringSchema,
  courseSourcedId: CsvStringSchema,
  classSourcedId: CsvStringSchema,
  scoreScaleValue: CsvStringSchema,
});

export const UserProfilesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  userSourcedId: CsvStringSchema,
  profileType: CsvStringSchema,
  vendorId: CsvStringSchema,
  applicationId: OptionalCsvStringSchema,
  description: OptionalCsvStringSchema,
  credentialType: CsvStringSchema,
  username: CsvStringSchema,
  password: OptionalCsvStringSchema,
});

export const UserResourcesCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  userSourcedId: CsvStringSchema,
  orgSourcedId: OptionalCsvStringSchema,
  classSourcedId: OptionalCsvStringSchema,
  resourceSourcedId: CsvStringSchema,
});

export const UsersCsvRowSchema = strictObject({
  sourcedId: CsvStringSchema,
  status: CsvStringSchema,
  dateLastModified: CsvStringSchema,
  enabledUser: CsvStringSchema,
  username: CsvStringSchema,
  userIds: OptionalCsvStringSchema,
  givenName: CsvStringSchema,
  familyName: CsvStringSchema,
  middleName: OptionalCsvStringSchema,
  identifier: OptionalCsvStringSchema,
  email: OptionalCsvStringSchema,
  sms: OptionalCsvStringSchema,
  phone: OptionalCsvStringSchema,
  agentSourcedIds: OptionalCsvStringSchema,
  grades: OptionalCsvStringSchema,
  password: OptionalCsvStringSchema,
  userMasterIdentifier: OptionalCsvStringSchema,
  preferredGivenName: OptionalCsvStringSchema,
  preferredMiddleName: OptionalCsvStringSchema,
  preferredFamilyName: OptionalCsvStringSchema,
  primaryOrgSourcedId: OptionalCsvStringSchema,
  pronouns: OptionalCsvStringSchema,
});

export const ManifestCsvDocumentSchema = z.array(ManifestCsvRowSchema);
export const AcademicSessionsCsvDocumentSchema = z.array(AcademicSessionsCsvRowSchema);
export const CategoriesCsvDocumentSchema = z.array(CategoriesCsvRowSchema);
export const ClassesCsvDocumentSchema = z.array(ClassesCsvRowSchema);
export const ClassResourcesCsvDocumentSchema = z.array(ClassResourcesCsvRowSchema);
export const CourseResourcesCsvDocumentSchema = z.array(CourseResourcesCsvRowSchema);
export const CoursesCsvDocumentSchema = z.array(CoursesCsvRowSchema);
export const DemographicsCsvDocumentSchema = z.array(DemographicsCsvRowSchema);
export const EnrollmentsCsvDocumentSchema = z.array(EnrollmentsCsvRowSchema);
export const LineItemLearningObjectiveIdsCsvDocumentSchema = z.array(LineItemLearningObjectiveIdsCsvRowSchema);
export const LineItemsCsvDocumentSchema = z.array(LineItemsCsvRowSchema);
export const LineItemScoreScalesCsvDocumentSchema = z.array(LineItemScoreScalesCsvRowSchema);
export const OrgsCsvDocumentSchema = z.array(OrgsCsvRowSchema);
export const ResourcesCsvDocumentSchema = z.array(ResourcesCsvRowSchema);
export const ResultLearningObjectiveIdsCsvDocumentSchema = z.array(ResultLearningObjectiveIdsCsvRowSchema);
export const ResultsCsvDocumentSchema = z.array(ResultsCsvRowSchema);
export const ResultScoreScalesCsvDocumentSchema = z.array(ResultScoreScalesCsvRowSchema);
export const RolesCsvDocumentSchema = z.array(RolesCsvRowSchema);
export const ScoreScalesCsvDocumentSchema = z.array(ScoreScalesCsvRowSchema);
export const UserProfilesCsvDocumentSchema = z.array(UserProfilesCsvRowSchema);
export const UserResourcesCsvDocumentSchema = z.array(UserResourcesCsvRowSchema);
export const UsersCsvDocumentSchema = z.array(UsersCsvRowSchema);

export const OneRosterCsvBindingPackageSchema = strictObject({
  manifest: ManifestCsvDocumentSchema,
  academicSessions: AcademicSessionsCsvDocumentSchema.optional(),
  categories: CategoriesCsvDocumentSchema.optional(),
  classes: ClassesCsvDocumentSchema.optional(),
  classResources: ClassResourcesCsvDocumentSchema.optional(),
  courseResources: CourseResourcesCsvDocumentSchema.optional(),
  courses: CoursesCsvDocumentSchema.optional(),
  demographics: DemographicsCsvDocumentSchema.optional(),
  enrollments: EnrollmentsCsvDocumentSchema.optional(),
  lineItemLearningObjectiveIds: LineItemLearningObjectiveIdsCsvDocumentSchema.optional(),
  lineItems: LineItemsCsvDocumentSchema.optional(),
  lineItemScoreScales: LineItemScoreScalesCsvDocumentSchema.optional(),
  orgs: OrgsCsvDocumentSchema.optional(),
  resources: ResourcesCsvDocumentSchema.optional(),
  resultLearningObjectiveIds: ResultLearningObjectiveIdsCsvDocumentSchema.optional(),
  results: ResultsCsvDocumentSchema.optional(),
  resultScoreScales: ResultScoreScalesCsvDocumentSchema.optional(),
  roles: RolesCsvDocumentSchema.optional(),
  scoreScales: ScoreScalesCsvDocumentSchema.optional(),
  userProfiles: UserProfilesCsvDocumentSchema.optional(),
  userResources: UserResourcesCsvDocumentSchema.optional(),
  users: UsersCsvDocumentSchema.optional(),
});
