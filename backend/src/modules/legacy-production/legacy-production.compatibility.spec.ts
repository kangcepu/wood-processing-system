import { evaluateCompatibility } from "./legacy-production.compatibility";

function buildRecord(overrides: Partial<Parameters<typeof evaluateCompatibility>[0]> = {}) {
  return {
    itemReferenceId: "item-1",
    uomCode: "M3",
    processType: "SAWMILL" as const,
    outputQuantity: 10,
    ...overrides,
  };
}

function buildWorkOrder(overrides: Partial<Parameters<typeof evaluateCompatibility>[1]> = {}) {
  return {
    status: "RELEASED",
    itemReferenceId: "item-1",
    uomCode: "M3",
    quantity: 20,
    operationProcessTypes: ["SAWMILL" as const, "PACKING" as const],
    ...overrides,
  };
}

describe("evaluateCompatibility", () => {
  it("returns no warnings or blocking errors for a fully matching assignment", () => {
    const result = evaluateCompatibility(buildRecord(), buildWorkOrder(), 5, 0);
    expect(result).toEqual({
      itemMatch: true,
      uomMatch: true,
      processMatch: true,
      quantityOk: true,
      warnings: [],
      blockingErrors: [],
    });
  });

  it("warns on item mismatch without blocking", () => {
    const result = evaluateCompatibility(buildRecord({ itemReferenceId: "item-2" }), buildWorkOrder(), 5, 0);
    expect(result.itemMatch).toBe(false);
    expect(result.warnings).toContain("Item legacy tidak sama dengan item Work Order");
    expect(result.blockingErrors).toHaveLength(0);
  });

  it("warns on UOM mismatch without blocking", () => {
    const result = evaluateCompatibility(buildRecord({ uomCode: "KG" }), buildWorkOrder(), 5, 0);
    expect(result.uomMatch).toBe(false);
    expect(result.blockingErrors).toHaveLength(0);
  });

  it("warns when the process type is not part of the Work Order routing", () => {
    const result = evaluateCompatibility(buildRecord(), buildWorkOrder({ operationProcessTypes: ["PACKING"] }), 5, 0);
    expect(result.processMatch).toBe(false);
    expect(result.blockingErrors).toHaveLength(0);
  });

  it("blocks when the Work Order is cancelled", () => {
    const result = evaluateCompatibility(buildRecord(), buildWorkOrder({ status: "CANCELLED" }), 5, 0);
    expect(result.blockingErrors).toContain("Work Order telah dibatalkan");
  });

  it("blocks when the quantity exceeds the remaining eligible Work Order quantity", () => {
    const result = evaluateCompatibility(buildRecord(), buildWorkOrder({ quantity: 10 }), 8, 5);
    expect(result.quantityOk).toBe(false);
    expect(result.blockingErrors.some((e) => e.includes("sisa quantity"))).toBe(true);
  });

  it("blocks when the quantity exceeds the legacy record's own output quantity", () => {
    const result = evaluateCompatibility(buildRecord({ outputQuantity: 3 }), buildWorkOrder(), 5, 0);
    expect(result.quantityOk).toBe(false);
    expect(result.blockingErrors.some((e) => e.includes("output quantity"))).toBe(true);
  });
});
