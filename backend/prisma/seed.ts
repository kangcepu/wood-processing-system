import { PrismaClient, type AccessArea, type PermissionAction, type RoleCode } from "@prisma/client";
import * as argon2 from "argon2";
import { LEGACY_DUMMY_SEED_BATCH, LEGACY_DUMMY_SEED_RECORDS } from "../src/modules/legacy-production/legacy-dummy-seed-data";

const prisma = new PrismaClient();

const ALL_AREAS: AccessArea[] = [
  "HOME",
  "SALES_ORDERS",
  "WORK_ORDER",
  "PLANNING",
  "PROCUREMENT",
  "RECEIVING_PBB",
  "SAWMILL_ST",
  "VACUUM_KD",
  "PRODUCTION",
  "QUALITY",
  "STOCK_ALLOCATION",
  "PACKING_SHIPPING",
  "TRACEABILITY",
  "NYANGKUT_REWORK",
  "LEGACY_PRODUCTION_DUMMY",
  "DASHBOARDS",
  "REPORTS",
  "SETTINGS",
];

const ALL_ACTIONS: PermissionAction[] = ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE", "EXPORT"];

const FULL_CRUD: PermissionAction[] = ["READ", "CREATE", "UPDATE", "DELETE"];
const FULL_CRUD_APPROVE: PermissionAction[] = ["READ", "CREATE", "UPDATE", "DELETE", "APPROVE"];
const READ_ONLY: PermissionAction[] = ["READ"];
const READ_EXPORT: PermissionAction[] = ["READ", "EXPORT"];

const ROLE_AREA_ACTIONS: Record<RoleCode, Partial<Record<AccessArea, PermissionAction[]>>> = {
  SUPER_ADMIN: {},
  ADMIN: {
    SETTINGS: ALL_ACTIONS,
    HOME: READ_ONLY,
    SALES_ORDERS: READ_ONLY,
    WORK_ORDER: READ_ONLY,
    PLANNING: READ_ONLY,
    PROCUREMENT: READ_ONLY,
    RECEIVING_PBB: READ_ONLY,
    SAWMILL_ST: READ_ONLY,
    VACUUM_KD: READ_ONLY,
    PRODUCTION: READ_ONLY,
    QUALITY: READ_ONLY,
    STOCK_ALLOCATION: READ_ONLY,
    PACKING_SHIPPING: READ_ONLY,
    TRACEABILITY: READ_ONLY,
    NYANGKUT_REWORK: READ_ONLY,
    LEGACY_PRODUCTION_DUMMY: READ_ONLY,
    DASHBOARDS: READ_ONLY,
    REPORTS: READ_ONLY,
  },
  MANAGEMENT: {
    HOME: READ_ONLY,
    DASHBOARDS: READ_EXPORT,
    REPORTS: READ_EXPORT,
    SALES_ORDERS: ["READ", "APPROVE"],
    WORK_ORDER: ["READ", "APPROVE"],
    PLANNING: READ_ONLY,
    PRODUCTION: READ_ONLY,
    QUALITY: READ_ONLY,
    STOCK_ALLOCATION: READ_ONLY,
    PACKING_SHIPPING: READ_ONLY,
    TRACEABILITY: READ_ONLY,
  },
  SALES: {
    HOME: READ_ONLY,
    SALES_ORDERS: FULL_CRUD,
    WORK_ORDER: READ_ONLY,
    DASHBOARDS: READ_ONLY,
    REPORTS: READ_ONLY,
  },
  PPIC: {
    HOME: READ_ONLY,
    WORK_ORDER: FULL_CRUD_APPROVE,
    PLANNING: FULL_CRUD_APPROVE,
    LEGACY_PRODUCTION_DUMMY: FULL_CRUD_APPROVE,
    SALES_ORDERS: READ_ONLY,
    PROCUREMENT: READ_ONLY,
    STOCK_ALLOCATION: READ_ONLY,
    DASHBOARDS: READ_ONLY,
  },
  PROCUREMENT: {
    HOME: READ_ONLY,
    PROCUREMENT: FULL_CRUD,
    PLANNING: READ_ONLY,
    WORK_ORDER: READ_ONLY,
  },
  RECEIVING_PBB: {
    HOME: READ_ONLY,
    RECEIVING_PBB: FULL_CRUD,
    STOCK_ALLOCATION: READ_ONLY,
    WORK_ORDER: READ_ONLY,
  },
  STOCK_CONTROLLER: {
    HOME: READ_ONLY,
    STOCK_ALLOCATION: FULL_CRUD,
    RECEIVING_PBB: READ_ONLY,
    PRODUCTION: READ_ONLY,
    PACKING_SHIPPING: READ_ONLY,
  },
  PRODUCTION_OPERATOR: {
    HOME: READ_ONLY,
    PRODUCTION: FULL_CRUD,
    SAWMILL_ST: FULL_CRUD,
    VACUUM_KD: FULL_CRUD,
    LEGACY_PRODUCTION_DUMMY: FULL_CRUD,
    WORK_ORDER: READ_ONLY,
    QUALITY: READ_ONLY,
  },
  PRODUCTION_SUPERVISOR: {
    HOME: READ_ONLY,
    PRODUCTION: FULL_CRUD_APPROVE,
    SAWMILL_ST: FULL_CRUD_APPROVE,
    VACUUM_KD: FULL_CRUD_APPROVE,
    NYANGKUT_REWORK: FULL_CRUD_APPROVE,
    LEGACY_PRODUCTION_DUMMY: FULL_CRUD_APPROVE,
    WORK_ORDER: READ_ONLY,
    QUALITY: READ_ONLY,
    STOCK_ALLOCATION: READ_ONLY,
  },
  QC: {
    HOME: READ_ONLY,
    QUALITY: FULL_CRUD_APPROVE,
    NYANGKUT_REWORK: FULL_CRUD_APPROVE,
    PRODUCTION: READ_ONLY,
    WORK_ORDER: READ_ONLY,
  },
  PACKING: {
    HOME: READ_ONLY,
    PACKING_SHIPPING: FULL_CRUD,
    QUALITY: READ_ONLY,
    WORK_ORDER: READ_ONLY,
  },
  SHIPPING: {
    HOME: READ_ONLY,
    PACKING_SHIPPING: FULL_CRUD,
    TRACEABILITY: FULL_CRUD,
    WORK_ORDER: READ_ONLY,
  },
  MAINTENANCE_VIEWER: {
    HOME: READ_ONLY,
    PRODUCTION: READ_ONLY,
    DASHBOARDS: READ_ONLY,
  },
  AUDITOR: ALL_AREAS.reduce<Partial<Record<AccessArea, PermissionAction[]>>>((acc, area) => {
    acc[area] = READ_EXPORT;
    return acc;
  }, {}),
};

const ROLE_NAMES: Record<RoleCode, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGEMENT: "Management",
  SALES: "Sales",
  PPIC: "PPIC",
  PROCUREMENT: "Procurement",
  RECEIVING_PBB: "Receiving / PBB",
  STOCK_CONTROLLER: "Stock Controller",
  PRODUCTION_OPERATOR: "Production Operator",
  PRODUCTION_SUPERVISOR: "Production Supervisor",
  QC: "Quality Control",
  PACKING: "Packing",
  SHIPPING: "Shipping",
  MAINTENANCE_VIEWER: "Maintenance Viewer",
  AUDITOR: "Auditor",
};

const SEED_PASSWORD = "Wps#2026Seed!";

async function main(): Promise<void> {
  const company = await prisma.company.upsert({
    where: { code: "WPS" },
    create: { code: "WPS", name: "PT WPS Wood Production", timezone: "Asia/Jakarta" },
    update: {},
  });

  const site = await prisma.site.upsert({
    where: { companyId_code: { companyId: company.id, code: "MAIN" } },
    create: { companyId: company.id, code: "MAIN", name: "Site Utama", timezone: "Asia/Jakarta" },
    update: {},
  });

  const department = await prisma.department.upsert({
    where: { siteId_code: { siteId: site.id, code: "GEN" } },
    create: { siteId: site.id, code: "GEN", name: "Produksi Umum" },
    update: {},
  });

  await prisma.shift.upsert({
    where: { siteId_code: { siteId: site.id, code: "S1" } },
    create: { siteId: site.id, code: "S1", name: "Shift 1", startTime: "07:00", endTime: "15:00" },
    update: {},
  });

  for (const area of ALL_AREAS) {
    for (const action of ALL_ACTIONS) {
      await prisma.permission.upsert({
        where: { area_action: { area, action } },
        create: { area, action },
        update: {},
      });
    }
  }

  const passwordHash = await argon2.hash(SEED_PASSWORD);

  for (const roleCode of Object.keys(ROLE_AREA_ACTIONS) as RoleCode[]) {
    const role = await prisma.role.upsert({
      where: { code: roleCode },
      create: { code: roleCode, name: ROLE_NAMES[roleCode] },
      update: { name: ROLE_NAMES[roleCode] },
    });

    const areaActions = ROLE_AREA_ACTIONS[roleCode];
    for (const [area, actions] of Object.entries(areaActions) as [AccessArea, PermissionAction[]][]) {
      for (const action of actions) {
        const permission = await prisma.permission.findUniqueOrThrow({
          where: { area_action: { area, action } },
        });
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
          create: { roleId: role.id, permissionId: permission.id },
          update: {},
        });
      }
    }

    const username = roleCode.toLowerCase();
    const user = await prisma.user.upsert({
      where: { username },
      create: {
        username,
        email: `${username}@wps.local`,
        fullname: `${ROLE_NAMES[roleCode]} (Seed)`,
        passwordHash,
        isEmployeeSourced: false,
        companyId: company.id,
        siteId: site.id,
        departmentId: department.id,
        mustChangePassword: true,
      },
      update: {},
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }

  await prisma.customerReference.upsert({
    where: { code: "CUST-001" },
    create: { code: "CUST-001", name: "PT Mitra Kayu Nusantara" },
    update: {},
  });

  const items: Array<{ code: string; name: string; uomCode: string; woodSpecies: string; itemGroup: string }> = [
    { code: "ITEM-MRT-2X4", name: "Meranti S4S 2x4 inch", uomCode: "M3", woodSpecies: "Meranti", itemGroup: "Sawn Timber" },
    { code: "ITEM-JTI-3X6", name: "Jati S4S 3x6 inch", uomCode: "M3", woodSpecies: "Jati", itemGroup: "Sawn Timber" },
  ];
  for (const item of items) {
    await prisma.itemReference.upsert({ where: { code: item.code }, create: item, update: {} });
  }

  for (const key of ["BO", "TSPK", "WO"]) {
    const prefixedKey = `${key}:${new Date().getUTCFullYear()}`;
    await prisma.numberSequence.upsert({
      where: { key: prefixedKey },
      create: { key: prefixedKey, prefix: key, padLength: 6, lastValue: 0 },
      update: {},
    });
  }

  for (const seedRecord of LEGACY_DUMMY_SEED_RECORDS) {
    const item = await prisma.itemReference.findUnique({ where: { code: seedRecord.itemCode } });
    if (!item) continue;
    const existing = await prisma.legacyProductionRecord.findUnique({
      where: { legacyReferenceNumber: seedRecord.legacyReferenceNumber },
    });
    if (existing) continue;

    await prisma.legacyProductionRecord.create({
      data: {
        legacyReferenceNumber: seedRecord.legacyReferenceNumber,
        processType: seedRecord.processType,
        itemReferenceId: item.id,
        woodSpecies: seedRecord.woodSpecies,
        dimensions: seedRecord.dimensions,
        grade: seedRecord.grade,
        specificationText: seedRecord.specificationText,
        plannedQuantity: seedRecord.plannedQuantity,
        inputQuantity: seedRecord.inputQuantity,
        outputQuantity: seedRecord.outputQuantity,
        goodQuantity: seedRecord.goodQuantity,
        reworkQuantity: seedRecord.reworkQuantity,
        rejectQuantity: seedRecord.rejectQuantity,
        lossQuantity: seedRecord.lossQuantity,
        uomCode: seedRecord.uomCode,
        legacyProductionDate: new Date(seedRecord.legacyProductionDate),
        machineDisplay: seedRecord.machineDisplay,
        operatorDisplay: seedRecord.operatorDisplay,
        originalStatus: seedRecord.originalStatus,
        createdEnvironment: "development",
        seedBatch: LEGACY_DUMMY_SEED_BATCH,
        originalPayloadJson: { ...seedRecord, itemReferenceId: item.id },
      },
    });
  }

  console.error(`Seed completed. Default password for all seeded users: ${SEED_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
