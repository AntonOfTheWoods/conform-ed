export * from "./shared";

import {
  CredentialSchemaSchema,
  CredentialStatusSchema,
  CredentialSubjectSchema,
  EvidenceSchema,
  HolderSchema,
  ProofSchema,
  RefreshServiceSchema,
  TermsOfUseSchema,
  VerifiableCredentialSchema,
  VerifiablePresentationSchema,
} from "./shared";

export const VcDataModel20DerivedZodTemplates = {
  verifiableCredential: VerifiableCredentialSchema,
  verifiablePresentation: VerifiablePresentationSchema,
  credentialSubject: CredentialSubjectSchema,
  credentialSchema: CredentialSchemaSchema,
  credentialStatus: CredentialStatusSchema,
  refreshService: RefreshServiceSchema,
  termsOfUse: TermsOfUseSchema,
  proof: ProofSchema,
  evidence: EvidenceSchema,
  holder: HolderSchema,
} as const;
