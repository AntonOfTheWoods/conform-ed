/**
 * Capability Report types (ADR-0003): the runtime's answer to "can this content be
 * delivered, and if not, why". In their own module so the RP interpreter can report
 * issues without importing the React runtime.
 */

export type CapabilityIssueType =
  | "unsupported-interaction"
  | "invalid-interaction"
  | "unsupported-element"
  | "unsupported-rp";

export interface CapabilityIssue {
  readonly type: CapabilityIssueType;
  /** The interaction kind, element name, or RP rule/operator/template at issue. */
  readonly name: string;
  readonly responseIdentifier?: string;
  readonly detail?: string | undefined;
}

export interface CapabilityReport {
  readonly deliverable: boolean;
  readonly issues: readonly CapabilityIssue[];
}
