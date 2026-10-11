-- CreateEnum
CREATE TYPE "LegacyAssignmentStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED');

-- CreateTable
CREATE TABLE "legacy_production_records" (
    "id" TEXT NOT NULL,
    "legacyReferenceNumber" TEXT NOT NULL,
    "processType" "ProcessType" NOT NULL,
    "itemReferenceId" TEXT NOT NULL,
    "woodSpecies" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "specificationText" TEXT,
    "plannedQuantity" DECIMAL(18,4) NOT NULL,
    "inputQuantity" DECIMAL(18,4) NOT NULL,
    "outputQuantity" DECIMAL(18,4) NOT NULL,
    "goodQuantity" DECIMAL(18,4) NOT NULL,
    "reworkQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "rejectQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "lossQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "uomCode" TEXT NOT NULL,
    "legacyProductionDate" TIMESTAMP(3) NOT NULL,
    "machineDisplay" TEXT NOT NULL,
    "operatorDisplay" TEXT NOT NULL,
    "originalStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'LEGACY_DUMMY',
    "createdEnvironment" TEXT NOT NULL,
    "seedBatch" TEXT NOT NULL,
    "originalPayloadJson" JSONB NOT NULL,
    "assignmentStatus" "LegacyAssignmentStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "currentAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "legacy_production_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legacy_production_assignments" (
    "id" TEXT NOT NULL,
    "legacyProductionRecordId" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "assignedQuantity" DECIMAL(18,4) NOT NULL,
    "compatibilityResultJson" JSONB NOT NULL,
    "overrideReason" TEXT,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedBy" TEXT,
    "unassignedReason" TEXT,
    "unassignedAt" TIMESTAMP(3),
    "auditEventId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "legacy_production_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "legacy_production_records_legacyReferenceNumber_key" ON "legacy_production_records"("legacyReferenceNumber");

-- CreateIndex
CREATE INDEX "legacy_production_assignments_legacyProductionRecordId_idx" ON "legacy_production_assignments"("legacyProductionRecordId");

-- CreateIndex
CREATE INDEX "legacy_production_assignments_workOrderId_idx" ON "legacy_production_assignments"("workOrderId");

-- AddForeignKey
ALTER TABLE "legacy_production_records" ADD CONSTRAINT "legacy_production_records_itemReferenceId_fkey" FOREIGN KEY ("itemReferenceId") REFERENCES "item_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_production_assignments" ADD CONSTRAINT "legacy_production_assignments_legacyProductionRecordId_fkey" FOREIGN KEY ("legacyProductionRecordId") REFERENCES "legacy_production_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legacy_production_assignments" ADD CONSTRAINT "legacy_production_assignments_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
