import { z } from "zod";

import {
  AcademicSessionSetSchema,
  ClassSetSchema,
  CourseSetSchema,
  DemographicsSetSchema,
  EnrollmentSetSchema,
  OrgSetSchema,
  SingleAcademicSessionSchema,
  SingleClassSchema,
  SingleCourseSchema,
  SingleDemographicsSchema,
  SingleEnrollmentSchema,
  SingleOrgSchema,
  SingleUserSchema,
  UserSetSchema,
} from "./or_v1p2_rostering_service_schema";
import { ImsxStatusInfoSchema } from "./shared";

const EmptyPayloadSchema = z.undefined();

function rosteringGetOperation(path: string, successResponsePayload: z.ZodTypeAny) {
  return {
    method: "GET",
    path,
    requestPayload: EmptyPayloadSchema,
    successResponsePayload,
    errorResponsePayload: ImsxStatusInfoSchema,
  } as const;
}

export const RosteringRestBindingOperationSchemas = {
  getAllAcademicSessions: rosteringGetOperation("/academicSessions", AcademicSessionSetSchema),
  getAcademicSession: rosteringGetOperation("/academicSessions/{sourcedId}", SingleAcademicSessionSchema),
  getAllClasses: rosteringGetOperation("/classes", ClassSetSchema),
  getStudentsForClass: rosteringGetOperation("/classes/{classSourcedId}/students", UserSetSchema),
  getTeachersForClass: rosteringGetOperation("/classes/{classSourcedId}/teachers", UserSetSchema),
  getClass: rosteringGetOperation("/classes/{sourcedId}", SingleClassSchema),
  getAllCourses: rosteringGetOperation("/courses", CourseSetSchema),
  getClassesForCourse: rosteringGetOperation("/courses/{courseSourcedId}/classes", ClassSetSchema),
  getCourse: rosteringGetOperation("/courses/{sourcedId}", SingleCourseSchema),
  getAllDemographics: rosteringGetOperation("/demographics", DemographicsSetSchema),
  getDemographics: rosteringGetOperation("/demographics/{sourcedId}", SingleDemographicsSchema),
  getAllEnrollments: rosteringGetOperation("/enrollments", EnrollmentSetSchema),
  getEnrollment: rosteringGetOperation("/enrollments/{sourcedId}", SingleEnrollmentSchema),
  getAllGradingPeriods: rosteringGetOperation("/gradingPeriods", AcademicSessionSetSchema),
  getGradingPeriod: rosteringGetOperation("/gradingPeriods/{sourcedId}", SingleAcademicSessionSchema),
  getAllOrgs: rosteringGetOperation("/orgs", OrgSetSchema),
  getOrg: rosteringGetOperation("/orgs/{sourcedId}", SingleOrgSchema),
  getAllSchools: rosteringGetOperation("/schools", OrgSetSchema),
  getClassesForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/classes", ClassSetSchema),
  getEnrollmentsForClassInSchool: rosteringGetOperation(
    "/schools/{schoolSourcedId}/classes/{classSourcedId}/enrollments",
    EnrollmentSetSchema,
  ),
  getStudentsForClassInSchool: rosteringGetOperation(
    "/schools/{schoolSourcedId}/classes/{classSourcedId}/students",
    UserSetSchema,
  ),
  getTeachersForClassInSchool: rosteringGetOperation(
    "/schools/{schoolSourcedId}/classes/{classSourcedId}/teachers",
    UserSetSchema,
  ),
  getCoursesForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/courses", CourseSetSchema),
  getEnrollmentsForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/enrollments", EnrollmentSetSchema),
  getStudentsForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/students", UserSetSchema),
  getTeachersForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/teachers", UserSetSchema),
  getTermsForSchool: rosteringGetOperation("/schools/{schoolSourcedId}/terms", AcademicSessionSetSchema),
  getSchool: rosteringGetOperation("/schools/{sourcedId}", SingleOrgSchema),
  getAllStudents: rosteringGetOperation("/students", UserSetSchema),
  getStudent: rosteringGetOperation("/students/{sourcedId}", SingleUserSchema),
  getClassesForStudent: rosteringGetOperation("/students/{studentSourcedId}/classes", ClassSetSchema),
  getAllTeachers: rosteringGetOperation("/teachers", UserSetSchema),
  getTeacher: rosteringGetOperation("/teachers/{sourcedId}", SingleUserSchema),
  getClassesForTeacher: rosteringGetOperation("/teachers/{teacherSourcedId}/classes", ClassSetSchema),
  getAllTerms: rosteringGetOperation("/terms", AcademicSessionSetSchema),
  getTerm: rosteringGetOperation("/terms/{sourcedId}", SingleAcademicSessionSchema),
  getClassesForTerm: rosteringGetOperation("/terms/{termSourcedId}/classes", ClassSetSchema),
  getGradingPeriodsForTerm: rosteringGetOperation("/terms/{termSourcedId}/gradingPeriods", AcademicSessionSetSchema),
  getAllUsers: rosteringGetOperation("/users", UserSetSchema),
  getUser: rosteringGetOperation("/users/{sourcedId}", SingleUserSchema),
  getClassesForUser: rosteringGetOperation("/users/{userSourcedId}/classes", ClassSetSchema),
} as const;
