import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluatePhCompliance,
  isValidPhLegalId,
  PH_LEGAL_ID_CODES,
  type BannedProductRule,
} from "../src/lib/compliance/ph.ts";

const SEEDED_RULES: BannedProductRule[] = [
  {
    id: "101",
    rule_type: "banned_brand",
    brand_pattern: "flava",
    flavor_pattern: null,
    description: "DTI FTEB suspended Flava Corporation vape product lines",
    legal_basis: "RA 11900 §12 / DTI FTEB Enforcement Order",
    status: "active",
  },
  {
    id: "102",
    rule_type: "banned_brand",
    brand_pattern: "romio",
    flavor_pattern: null,
    description: "DTI FTEB suspended ROMIO vape product lines",
    legal_basis: "RA 11900 §12 / DTI FTEB Enforcement Order",
    status: "active",
  },
  {
    id: "103",
    rule_type: "prohibited_flavor_descriptor",
    brand_pattern: null,
    flavor_pattern:
      "strawberry|mango|watermelon|grape|blueberry|candy|gummy|bubblegum|donut|cake|ice cream|cartoon",
    description: "Minor-appealing flavor descriptors prohibited under RA 11900",
    legal_basis: "RA 11900 §12 / DTI DAO No. 24-04",
    status: "active",
  },
];

describe("RA 11900 / DTI PH Compliance Gate (BR-06)", () => {
  it("accepts all 10 official PH government ID types", () => {
    assert.equal(PH_LEGAL_ID_CODES.length, 10);
    for (const code of PH_LEGAL_ID_CODES) {
      assert.equal(isValidPhLegalId(code), true);
    }
    assert.equal(isValidPhLegalId("student_id"), false);
    assert.equal(isValidPhLegalId(""), false);
    assert.equal(isValidPhLegalId(null), false);
  });

  it("blocks DTI-suspended brands (Flava, ROMIO) with GATE: REG-PH", () => {
    const flava = evaluatePhCompliance(
      {
        brand: "Flava",
        flavorDescriptor: "Classic Tobacco",
        dtiPsMark: "PS-12345",
      },
      SEEDED_RULES
    );
    assert.equal(flava.allowed, false);
    if (!flava.allowed) {
      assert.equal(flava.code, "GATE: REG-PH");
    }

    const romio = evaluatePhCompliance(
      {
        brand: "ROMIO Pro",
        flavorDescriptor: "Menthol",
        dtiPsMark: "PS-12345",
      },
      SEEDED_RULES
    );
    assert.equal(romio.allowed, false);
  });

  it("blocks minor-appealing flavor descriptors (fruit/candy/dessert/cartoon)", () => {
    const res = evaluatePhCompliance(
      {
        brand: "ValidBrand",
        flavorDescriptor: "Iced Strawberry Candy",
        dtiPsMark: "PS-99999",
      },
      SEEDED_RULES
    );
    assert.equal(res.allowed, false);
    if (!res.allowed) {
      assert.equal(res.code, "GATE: REG-PH");
    }
  });

  it("blocks products missing DTI PS Licensing Mark", () => {
    const res = evaluatePhCompliance(
      {
        brand: "ValidBrand",
        flavorDescriptor: "Classic Tobacco",
        dtiPsMark: "",
      },
      SEEDED_RULES
    );
    assert.equal(res.allowed, false);
  });

  it("allows compliant adult-only tobacco/menthol product with valid PS mark", () => {
    const res = evaluatePhCompliance(
      {
        brand: "ValidBrand",
        flavorDescriptor: "Classic Menthol",
        dtiPsMark: "PS-2026-0042",
      },
      SEEDED_RULES
    );
    assert.deepEqual(res, { allowed: true });
  });
});
