import { z } from "zod";

import {
  AcadSessionGuidRefSchema,
  ClassGuidRefSchema,
  CourseGuidRefSchema,
  DateSchema,
  DateTimeSchema,
  EntityStatusSchema,
  extensibleEnum,
  MetadataSchema,
  OrgGuidRefSchema,
  ResourceGuidRefSchema,
  SourcedIdSchema,
  strictObject,
  TrueFalseStringSchema,
  UrlSchema,
  UserGuidRefSchema,
} from "./shared";

export const AcademicSessionTypeSchema = extensibleEnum(["gradingPeriod", "semester", "schoolYear", "term"]);
export const ClassTypeSchema = extensibleEnum(["homeroom", "scheduled"]);
export const DemographicsSexSchema = extensibleEnum(["male", "female", "unspecified", "other"]);
export const EnrollmentRoleSchema = extensibleEnum(["administrator", "proctor", "student", "teacher"]);
export const OrganizationTypeSchema = extensibleEnum([
  "department",
  "district",
  "local",
  "national",
  "school",
  "state",
]);
export const UserOrganizationRoleSchema = extensibleEnum([
  "aide",
  "counselor",
  "districtAdministrator",
  "guardian",
  "parent",
  "principal",
  "proctor",
  "relative",
  "siteAdministrator",
  "student",
  "systemAdministrator",
  "teacher",
]);

export const CredentialSchema = z
  .object({
    type: z.string(),
    username: z.string(),
    password: z.string().optional(),
  })
  .loose();

export const UserIdSchema = strictObject({
  type: z.string(),
  identifier: z.string(),
});

export const UserProfileSchema = strictObject({
  profileId: UrlSchema,
  profileType: z.string(),
  vendorId: z.string(),
  applicationId: z.string().optional(),
  description: z.string().optional(),
  credentials: z.array(CredentialSchema).optional(),
});

export const RoleSchema = strictObject({
  roleType: z.enum(["primary", "secondary"]),
  role: UserOrganizationRoleSchema,
  org: OrgGuidRefSchema,
  userProfile: UrlSchema.optional(),
  beginDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
});

export const UserSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  userMasterIdentifier: z.string().optional(),
  username: z.string().optional(),
  userIds: z.array(UserIdSchema).optional(),
  enabledUser: TrueFalseStringSchema,
  givenName: z.string(),
  familyName: z.string(),
  middleName: z.string().optional(),
  preferredFirstName: z.string().optional(),
  preferredMiddleName: z.string().optional(),
  preferredLastName: z.string().optional(),
  pronouns: z.string().optional(),
  roles: z.array(RoleSchema).min(1),
  userProfiles: z.array(UserProfileSchema).optional(),
  primaryOrg: OrgGuidRefSchema.optional(),
  identifier: z.string().optional(),
  email: z.string().optional(),
  sms: z.string().optional(),
  phone: z.string().optional(),
  agents: z.array(UserGuidRefSchema).optional(),
  grades: z.array(z.string()).optional(),
  password: z.string().optional(),
  resources: z.array(ResourceGuidRefSchema).optional(),
});

export const OrgSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  name: z.string(),
  type: OrganizationTypeSchema,
  identifier: z.string(),
  parent: OrgGuidRefSchema.optional(),
  children: z.array(OrgGuidRefSchema).optional(),
});

export const AcademicSessionSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  startDate: DateSchema,
  endDate: DateSchema,
  type: AcademicSessionTypeSchema,
  parent: AcadSessionGuidRefSchema.optional(),
  children: z.array(AcadSessionGuidRefSchema).optional(),
  schoolYear: z.string(),
});

export const CourseSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  schoolYear: AcadSessionGuidRefSchema.optional(),
  courseCode: z.string(),
  grades: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  org: OrgGuidRefSchema.optional(),
  subjectCodes: z.array(z.string()).optional(),
  resources: z.array(ResourceGuidRefSchema).optional(),
});

export const ClassSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  title: z.string(),
  classCode: z.string().optional(),
  classType: ClassTypeSchema.optional(),
  location: z.string().optional(),
  grades: z.array(z.string()).optional(),
  subjects: z.array(z.string()).optional(),
  course: CourseGuidRefSchema,
  school: OrgGuidRefSchema,
  terms: z.array(AcadSessionGuidRefSchema).min(1),
  subjectCodes: z.array(z.string()).optional(),
  periods: z.array(z.string()).optional(),
  resources: z.array(ResourceGuidRefSchema).optional(),
});

export const DemographicsSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  birthDate: DateSchema.optional(),
  sex: DemographicsSexSchema.optional(),
  americanIndianOrAlaskaNative: TrueFalseStringSchema.optional(),
  asian: TrueFalseStringSchema.optional(),
  blackOrAfricanAmerican: TrueFalseStringSchema.optional(),
  nativeHawaiianOrOtherPacificIslander: TrueFalseStringSchema.optional(),
  white: TrueFalseStringSchema.optional(),
  demographicRaceTwoOrMoreRaces: TrueFalseStringSchema.optional(),
  hispanicOrLatinoEthnicity: TrueFalseStringSchema.optional(),
  countryOfBirthCode: z.string().optional(),
  stateOfBirthAbbreviation: z.string().optional(),
  cityOfBirth: z.string().optional(),
  publicSchoolResidenceStatus: z.string().optional(),
});

export const EnrollmentSchema = strictObject({
  sourcedId: SourcedIdSchema,
  status: EntityStatusSchema,
  dateLastModified: DateTimeSchema,
  metadata: MetadataSchema.optional(),
  user: UserGuidRefSchema,
  class: ClassGuidRefSchema,
  school: OrgGuidRefSchema,
  role: EnrollmentRoleSchema,
  primary: TrueFalseStringSchema.optional(),
  beginDate: DateSchema.optional(),
  endDate: DateSchema.optional(),
});

export const UserSetSchema = strictObject({
  users: z.array(UserSchema).optional(),
});

export const OrgSetSchema = strictObject({
  orgs: z.array(OrgSchema).optional(),
});

export const AcademicSessionSetSchema = strictObject({
  academicSessions: z.array(AcademicSessionSchema).optional(),
});

export const CourseSetSchema = strictObject({
  courses: z.array(CourseSchema).optional(),
});

export const ClassSetSchema = strictObject({
  classes: z.array(ClassSchema).optional(),
});

export const DemographicsSetSchema = strictObject({
  demographics: z.array(DemographicsSchema).optional(),
});

export const EnrollmentSetSchema = strictObject({
  enrollments: z.array(EnrollmentSchema).optional(),
});

export const SingleUserSchema = strictObject({
  user: UserSchema,
});

export const SingleOrgSchema = strictObject({
  org: OrgSchema,
});

export const SingleAcademicSessionSchema = strictObject({
  academicSession: AcademicSessionSchema,
});

export const SingleCourseSchema = strictObject({
  course: CourseSchema,
});

export const SingleClassSchema = strictObject({
  class: ClassSchema,
});

export const SingleDemographicsSchema = strictObject({
  demographics: DemographicsSchema,
});

export const SingleEnrollmentSchema = strictObject({
  enrollment: EnrollmentSchema,
});
// Inferred types from exported Zod validators.
export type AcademicSessionType = z.infer<typeof AcademicSessionTypeSchema>;
export type ClassType = z.infer<typeof ClassTypeSchema>;
export type DemographicsSex = z.infer<typeof DemographicsSexSchema>;
export type EnrollmentRole = z.infer<typeof EnrollmentRoleSchema>;
export type OrganizationType = z.infer<typeof OrganizationTypeSchema>;
export type UserOrganizationRole = z.infer<typeof UserOrganizationRoleSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type UserId = z.infer<typeof UserIdSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type Org = z.infer<typeof OrgSchema>;
export type AcademicSession = z.infer<typeof AcademicSessionSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type Demographics = z.infer<typeof DemographicsSchema>;
export type Enrollment = z.infer<typeof EnrollmentSchema>;
export type UserSet = z.infer<typeof UserSetSchema>;
export type OrgSet = z.infer<typeof OrgSetSchema>;
export type AcademicSessionSet = z.infer<typeof AcademicSessionSetSchema>;
export type CourseSet = z.infer<typeof CourseSetSchema>;
export type ClassSet = z.infer<typeof ClassSetSchema>;
export type DemographicsSet = z.infer<typeof DemographicsSetSchema>;
export type EnrollmentSet = z.infer<typeof EnrollmentSetSchema>;
export type SingleUser = z.infer<typeof SingleUserSchema>;
export type SingleOrg = z.infer<typeof SingleOrgSchema>;
export type SingleAcademicSession = z.infer<typeof SingleAcademicSessionSchema>;
export type SingleCourse = z.infer<typeof SingleCourseSchema>;
export type SingleClass = z.infer<typeof SingleClassSchema>;
export type SingleDemographics = z.infer<typeof SingleDemographicsSchema>;
export type SingleEnrollment = z.infer<typeof SingleEnrollmentSchema>;
