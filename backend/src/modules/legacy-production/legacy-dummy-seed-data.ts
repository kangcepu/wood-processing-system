export const LEGACY_DUMMY_SEED_BATCH = "SEED-V1";

export interface LegacyDummySeedRecord {
  legacyReferenceNumber: string;
  processType:
    | "SAWMILL"
    | "VACUUM_KD"
    | "S4S"
    | "FINGER_JOINT"
    | "MOULDING"
    | "ROTARY_LAMINATING"
    | "CROSS_CUT"
    | "SANDING"
    | "PACKING";
  itemCode: string;
  woodSpecies: string;
  dimensions: string;
  grade: string;
  specificationText: string;
  plannedQuantity: number;
  inputQuantity: number;
  outputQuantity: number;
  goodQuantity: number;
  reworkQuantity: number;
  rejectQuantity: number;
  lossQuantity: number;
  uomCode: string;
  legacyProductionDate: string;
  machineDisplay: string;
  operatorDisplay: string;
  originalStatus: string;
}

export const LEGACY_DUMMY_SEED_RECORDS: LegacyDummySeedRecord[] = [
  {
    legacyReferenceNumber: "LEG-SAWMILL-0001",
    processType: "SAWMILL",
    itemCode: "ITEM-MRT-2X4",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: "Sawmill log Meranti batch lama",
    plannedQuantity: 20,
    inputQuantity: 20,
    outputQuantity: 18,
    goodQuantity: 16,
    reworkQuantity: 1,
    rejectQuantity: 1,
    lossQuantity: 2,
    uomCode: "M3",
    legacyProductionDate: "2025-01-10T00:00:00.000Z",
    machineDisplay: "Sawmill-01",
    operatorDisplay: "Operator Legacy A",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-VACUUMKD-0001",
    processType: "VACUUM_KD",
    itemCode: "ITEM-MRT-2X4",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: "Pengeringan vacuum batch lama",
    plannedQuantity: 15,
    inputQuantity: 15,
    outputQuantity: 14,
    goodQuantity: 13,
    reworkQuantity: 0,
    rejectQuantity: 1,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-12T00:00:00.000Z",
    machineDisplay: "VacuumKD-01",
    operatorDisplay: "Operator Legacy B",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-S4S-0001",
    processType: "S4S",
    itemCode: "ITEM-MRT-2X4",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: "S4S finishing batch lama",
    plannedQuantity: 14,
    inputQuantity: 14,
    outputQuantity: 13,
    goodQuantity: 12,
    reworkQuantity: 0,
    rejectQuantity: 1,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-14T00:00:00.000Z",
    machineDisplay: "S4S-01",
    operatorDisplay: "Operator Legacy A",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-FINGERJOINT-0001",
    processType: "FINGER_JOINT",
    itemCode: "ITEM-JTI-3X6",
    woodSpecies: "Jati",
    dimensions: "3x6x4000",
    grade: "B",
    specificationText: "Finger joint batch lama",
    plannedQuantity: 10,
    inputQuantity: 10,
    outputQuantity: 9,
    goodQuantity: 8,
    reworkQuantity: 1,
    rejectQuantity: 0,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-16T00:00:00.000Z",
    machineDisplay: "FingerJoint-01",
    operatorDisplay: "Operator Legacy C",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-MOULDING-0001",
    processType: "MOULDING",
    itemCode: "ITEM-JTI-3X6",
    woodSpecies: "Jati",
    dimensions: "3x6x4000",
    grade: "B",
    specificationText: "Moulding profil batch lama",
    plannedQuantity: 10,
    inputQuantity: 10,
    outputQuantity: 9,
    goodQuantity: 9,
    reworkQuantity: 0,
    rejectQuantity: 0,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-18T00:00:00.000Z",
    machineDisplay: "Moulding-01",
    operatorDisplay: "Operator Legacy C",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-ROTARY-0001",
    processType: "ROTARY_LAMINATING",
    itemCode: "ITEM-MRT-2X4",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: "Rotary laminating batch lama",
    plannedQuantity: 12,
    inputQuantity: 12,
    outputQuantity: 11,
    goodQuantity: 10,
    reworkQuantity: 1,
    rejectQuantity: 0,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-20T00:00:00.000Z",
    machineDisplay: "Rotary-01",
    operatorDisplay: "Operator Legacy B",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-CROSSCUT-0001",
    processType: "CROSS_CUT",
    itemCode: "ITEM-MRT-2X4",
    woodSpecies: "Meranti",
    dimensions: "2x4x4000",
    grade: "A",
    specificationText: "Cross cut batch lama",
    plannedQuantity: 16,
    inputQuantity: 16,
    outputQuantity: 15,
    goodQuantity: 14,
    reworkQuantity: 0,
    rejectQuantity: 1,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-22T00:00:00.000Z",
    machineDisplay: "CrossCut-01",
    operatorDisplay: "Operator Legacy A",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-SANDING-0001",
    processType: "SANDING",
    itemCode: "ITEM-JTI-3X6",
    woodSpecies: "Jati",
    dimensions: "3x6x4000",
    grade: "B",
    specificationText: "Sanding finishing batch lama",
    plannedQuantity: 9,
    inputQuantity: 9,
    outputQuantity: 9,
    goodQuantity: 8,
    reworkQuantity: 0,
    rejectQuantity: 0,
    lossQuantity: 1,
    uomCode: "M3",
    legacyProductionDate: "2025-01-24T00:00:00.000Z",
    machineDisplay: "Sanding-01",
    operatorDisplay: "Operator Legacy C",
    originalStatus: "SELESAI",
  },
  {
    legacyReferenceNumber: "LEG-PACKING-0001",
    processType: "PACKING",
    itemCode: "ITEM-JTI-3X6",
    woodSpecies: "Jati",
    dimensions: "3x6x4000",
    grade: "B",
    specificationText: "Packing batch lama",
    plannedQuantity: 8,
    inputQuantity: 8,
    outputQuantity: 8,
    goodQuantity: 8,
    reworkQuantity: 0,
    rejectQuantity: 0,
    lossQuantity: 0,
    uomCode: "M3",
    legacyProductionDate: "2025-01-26T00:00:00.000Z",
    machineDisplay: "Packing-01",
    operatorDisplay: "Operator Legacy B",
    originalStatus: "SELESAI",
  },
];
