-- CreateEnum
CREATE TYPE "BuyerOrderStatus" AS ENUM ('DRAFT', 'NEGOTIATION', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REVISED', 'FULFILLED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TemporarySpkStatus" AS ENUM ('DRAFT', 'FEASIBILITY', 'REVIEW', 'WAITING_BUYER_CONFIRMATION', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'RELEASED', 'SCHEDULED', 'IN_PRODUCTION', 'FINAL_QC', 'READY_FOR_SHIPMENT', 'SHIPPED', 'COMPLETED', 'CLOSED', 'HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('SAWMILL', 'VACUUM_KD', 'S4S', 'FINGER_JOINT', 'MOULDING', 'ROTARY_LAMINATING', 'CROSS_CUT', 'SANDING', 'PACKING');

-- CreateEnum
CREATE TYPE "WorkOrderPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "padLength" INTEGER NOT NULL DEFAULT 6,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_references" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_references" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uomCode" TEXT NOT NULL,
    "woodSpecies" TEXT,
    "itemGroup" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerPoNumber" TEXT NOT NULL,
    "customerReferenceId" TEXT NOT NULL,
    "contractReference" TEXT,
    "status" "BuyerOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currentRevisionNo" INTEGER NOT NULL DEFAULT 1,
    "destination" TEXT NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "buyer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_order_lines" (
    "id" TEXT NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "itemReferenceId" TEXT NOT NULL,
    "woodSpecies" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "uomCode" TEXT NOT NULL,
    "moistureRequirement" TEXT,
    "packingRequirement" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "buyer_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_requirement_revisions" (
    "id" TEXT NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "revisionNo" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "changeReason" TEXT NOT NULL,
    "impactAcknowledged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "customer_requirement_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_spks" (
    "id" TEXT NOT NULL,
    "spkNumber" TEXT NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "status" "TemporarySpkStatus" NOT NULL DEFAULT 'DRAFT',
    "requirementRevisionNo" INTEGER NOT NULL,
    "notes" TEXT,
    "convertedWorkOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "temporary_spks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feasibility_scenarios" (
    "id" TEXT NOT NULL,
    "temporarySpkId" TEXT NOT NULL,
    "scenarioNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "assumptionsJson" JSONB NOT NULL,
    "resultJson" JSONB NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "feasibility_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "buyerOrderId" TEXT NOT NULL,
    "temporarySpkId" TEXT,
    "requirementRevisionNo" INTEGER NOT NULL,
    "itemReferenceId" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "uomCode" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "destination" TEXT NOT NULL,
    "priority" "WorkOrderPriority" NOT NULL DEFAULT 'NORMAL',
    "routingVersionLabel" TEXT NOT NULL,
    "selectedScenarioId" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "blockingReason" TEXT,
    "plannedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "actualQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "goodQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reworkQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "rejectQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "lossQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "packedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "shippedQuantity" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_operations" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "processType" "ProcessType" NOT NULL,
    "name" TEXT NOT NULL,
    "plannedStart" TIMESTAMP(3),
    "plannedFinish" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_order_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_key_key" ON "number_sequences"("key");

-- CreateIndex
CREATE UNIQUE INDEX "customer_references_code_key" ON "customer_references"("code");

-- CreateIndex
CREATE UNIQUE INDEX "item_references_code_key" ON "item_references"("code");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_orders_orderNumber_key" ON "buyer_orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_order_lines_buyerOrderId_lineNo_key" ON "buyer_order_lines"("buyerOrderId", "lineNo");

-- CreateIndex
CREATE UNIQUE INDEX "customer_requirement_revisions_buyerOrderId_revisionNo_key" ON "customer_requirement_revisions"("buyerOrderId", "revisionNo");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_spks_spkNumber_key" ON "temporary_spks"("spkNumber");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_spks_convertedWorkOrderId_key" ON "temporary_spks"("convertedWorkOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "feasibility_scenarios_temporarySpkId_scenarioNo_key" ON "feasibility_scenarios"("temporarySpkId", "scenarioNo");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_workOrderNumber_key" ON "work_orders"("workOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "work_order_operations_workOrderId_sequenceNo_key" ON "work_order_operations"("workOrderId", "sequenceNo");

-- CreateIndex
CREATE INDEX "approvals_objectType_objectId_idx" ON "approvals"("objectType", "objectId");

-- AddForeignKey
ALTER TABLE "buyer_orders" ADD CONSTRAINT "buyer_orders_customerReferenceId_fkey" FOREIGN KEY ("customerReferenceId") REFERENCES "customer_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_order_lines" ADD CONSTRAINT "buyer_order_lines_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_order_lines" ADD CONSTRAINT "buyer_order_lines_itemReferenceId_fkey" FOREIGN KEY ("itemReferenceId") REFERENCES "item_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_requirement_revisions" ADD CONSTRAINT "customer_requirement_revisions_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_spks" ADD CONSTRAINT "temporary_spks_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_spks" ADD CONSTRAINT "temporary_spks_convertedWorkOrderId_fkey" FOREIGN KEY ("convertedWorkOrderId") REFERENCES "work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feasibility_scenarios" ADD CONSTRAINT "feasibility_scenarios_temporarySpkId_fkey" FOREIGN KEY ("temporarySpkId") REFERENCES "temporary_spks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_buyerOrderId_fkey" FOREIGN KEY ("buyerOrderId") REFERENCES "buyer_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_temporarySpkId_fkey" FOREIGN KEY ("temporarySpkId") REFERENCES "temporary_spks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_itemReferenceId_fkey" FOREIGN KEY ("itemReferenceId") REFERENCES "item_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_operations" ADD CONSTRAINT "work_order_operations_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
