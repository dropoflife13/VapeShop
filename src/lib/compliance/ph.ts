export const PH_LEGAL_ID_CODES = [
  "philsys_national_id",
  "passport",
  "drivers_license",
  "umid_sss_gsis",
  "prc_id",
  "postal_id",
  "voters_id",
  "barangay_id",
  "senior_citizen_id",
  "pwd_id",
] as const;

export type PhLegalIdCode = (typeof PH_LEGAL_ID_CODES)[number];

const LEGAL_ID_SET: ReadonlySet<string> = new Set(PH_LEGAL_ID_CODES);

export function isValidPhLegalId(code: unknown): code is PhLegalIdCode {
  return typeof code === "string" && LEGAL_ID_SET.has(code);
}

export interface BannedProductRule {
  id: string;
  rule_type: "banned_brand" | "prohibited_flavor_descriptor" | "missing_certification";
  brand_pattern: string | null;
  flavor_pattern: string | null;
  description: string;
  legal_basis: string;
  status: "active" | "archived";
}

export interface ProductComplianceInput {
  brand: string;
  flavorDescriptor: string;
  dtiPsMark: string | null | undefined;
  birFiscalStamp?: string | null | undefined;
}

export type ComplianceCheckResult =
  | { allowed: true }
  | { allowed: false; code: "GATE: REG-PH"; reasons: string[] };

function matchesPattern(value: string, pattern: string | null): boolean {
  if (!pattern || !value) return false;
  try {
    const regex = new RegExp(pattern, "i");
    return regex.test(value);
  } catch {
    return value.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * Deterministic RA 11900 / DTI compliance gate (`BR-06`, `422 GATE: REG-PH`).
 */
export function evaluatePhCompliance(
  input: ProductComplianceInput,
  activeRules: readonly BannedProductRule[]
): ComplianceCheckResult {
  const reasons: string[] = [];

  if (!input.dtiPsMark || input.dtiPsMark.trim().length === 0) {
    reasons.push("Missing DTI Philippine Standard (PS) Licensing Mark (DAO 24-11).");
  }

  for (const rule of activeRules) {
    if (rule.status !== "active") continue;

    if (rule.brand_pattern && matchesPattern(input.brand, rule.brand_pattern)) {
      reasons.push(`${rule.description} (${rule.legal_basis})`);
    }
    if (
      rule.flavor_pattern &&
      matchesPattern(input.flavorDescriptor, rule.flavor_pattern)
    ) {
      reasons.push(`${rule.description} (${rule.legal_basis})`);
    }
  }

  if (reasons.length > 0) {
    return {
      allowed: false,
      code: "GATE: REG-PH",
      reasons,
    };
  }

  return { allowed: true };
}
