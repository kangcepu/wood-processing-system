import type { FeasibilityScenario as FeasibilityScenarioModel, TemporarySPK as TemporarySpkModel } from "@prisma/client";
import type { TemporarySpk } from "@wps/contracts";

type TemporarySpkWithScenarios = TemporarySpkModel & { scenarios: FeasibilityScenarioModel[] };

export function toTemporarySpk(spk: TemporarySpkWithScenarios): TemporarySpk {
  return {
    id: spk.id,
    spkNumber: spk.spkNumber,
    buyerOrderId: spk.buyerOrderId,
    status: spk.status,
    requirementRevisionNo: spk.requirementRevisionNo,
    notes: spk.notes,
    convertedWorkOrderId: spk.convertedWorkOrderId,
    scenarios: spk.scenarios
      .sort((a, b) => a.scenarioNo - b.scenarioNo)
      .map((scenario) => ({
        id: scenario.id,
        temporarySpkId: scenario.temporarySpkId,
        scenarioNo: scenario.scenarioNo,
        name: scenario.name,
        assumptionsJson: scenario.assumptionsJson,
        resultJson: scenario.resultJson,
        isSelected: scenario.isSelected,
        createdAt: scenario.createdAt.toISOString(),
      })),
    createdAt: spk.createdAt.toISOString(),
    updatedAt: spk.updatedAt.toISOString(),
    version: spk.version,
  };
}
