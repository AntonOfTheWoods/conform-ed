import * as CaseV1P1AssociationGrouping from "./case_v1p1_cfassociationgrouping_jsonschema1";
import * as CaseV1P1Association from "./case_v1p1_cfassociation_jsonschema1";
import * as CaseV1P1AssociationSet from "./case_v1p1_cfassociationset_jsonschema1";
import * as CaseV1P1ConceptSet from "./case_v1p1_cfconceptset_jsonschema1";
import * as CaseV1P1Document from "./case_v1p1_cfdocument_jsonschema1";
import * as CaseV1P1DocumentSet from "./case_v1p1_cfdocumentset_jsonschema1";
import * as CaseV1P1Item from "./case_v1p1_cfitem_jsonschema1";
import * as CaseV1P1ItemTypeSet from "./case_v1p1_cfitemtypeset_jsonschema1";
import * as CaseV1P1License from "./case_v1p1_cflicense_jsonschema1";
import * as CaseV1P1Package from "./case_v1p1_cfpackage_jsonschema1";
import * as CaseV1P1Rubric from "./case_v1p1_cfrubric_jsonschema1";
import * as CaseV1P1SubjectSet from "./case_v1p1_cfsubjectset_jsonschema1";
import * as CaseV1P1Status from "./case_v1p1_imsx_statusinfo_jsonschema1";
import {
  CFAssociationSchema,
  CFAssociationSetSchema,
  CFConceptSetSchema,
  CFItemSchema,
  CFItemTypeSetSchema,
  CFLicenseSchema,
  CFPackageSchema,
  CFRubricSchema,
  CFSubjectSetSchema,
  ImsxStatusInfoSchema,
  LinkUriSchema,
  LinkGenUriSchema,
  UuidSchema,
  DateTimeSchema,
  ExtensionEnumSchema,
} from "./shared";
import { CaseV1P1RestBindingOperations } from "./case_v1p1_openapi3_restbinding_schema";

export namespace CaseV1_1 {
  export namespace JsonSchema {
    export const AssociationGrouping = CaseV1P1AssociationGrouping;
    export const Association = CaseV1P1Association;
    export const AssociationSet = CaseV1P1AssociationSet;
    export const ConceptSet = CaseV1P1ConceptSet;
    export const Document = CaseV1P1Document;
    export const DocumentSet = CaseV1P1DocumentSet;
    export const Item = CaseV1P1Item;
    export const ItemTypeSet = CaseV1P1ItemTypeSet;
    export const License = CaseV1P1License;
    export const Package = CaseV1P1Package;
    export const Rubric = CaseV1P1Rubric;
    export const SubjectSet = CaseV1P1SubjectSet;
    export const Status = CaseV1P1Status;
  }

  export namespace Schemas {
    export const CFAssociation = CFAssociationSchema;
    export const CFAssociationSet = CFAssociationSetSchema;
    export const CFConceptSet = CFConceptSetSchema;
    export const CFItem = CFItemSchema;
    export const CFItemTypeSet = CFItemTypeSetSchema;
    export const CFLicense = CFLicenseSchema;
    export const CFPackage = CFPackageSchema;
    export const CFRubric = CFRubricSchema;
    export const CFSubjectSet = CFSubjectSetSchema;
    export const ImsxStatusInfo = ImsxStatusInfoSchema;
  }

  export namespace Shared {
    export const LinkUri = LinkUriSchema;
    export const LinkGenUri = LinkGenUriSchema;
    export const Uuid = UuidSchema;
    export const DateTime = DateTimeSchema;
    export const ExtensionEnum = ExtensionEnumSchema;
  }

  export namespace RestBinding {
    export const Operations = CaseV1P1RestBindingOperations;
  }
}

export type CaseV1_1Schemas = typeof CaseV1_1.Schemas;

export const Case11DerivedZodTemplates = {
  description: "CASE v1.1 Zod schemas derived from official 1EdTech JSON Schema and OpenAPI3 specifications",
  specLinks: {
    base: "https://www.imsglobal.org/spec/case/v1p1",
    jsonSchema: "https://purl.imsglobal.org/spec/case/v1p1/schema/json/",
    openApi: "https://purl.imsglobal.org/spec/case/v1p1/schema/openapi/",
  },
  scopes: {
    jsonSchema: ["CFAssociation", "CFPackage", "CFItem", "CFRubric", "CFConceptSet"],
    restBinding: ["GET operations for all major entity types"],
  },
  notes: [
    "CASE v1.1 introduces Competency and Academic Standards modeling in JSON Schema format.",
    "Core entities are modeled as strict Zod schemas with UUID identifiers and datetime tracking.",
    "REST binding operations expose structured method/path/payload contracts for direct API implementation.",
    "Extensible vocabularies use open enum pattern (standard values + ext:* custom extensions).",
  ],
};
