"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, Input, LoadingSkeleton, Modal, useToast } from "@wps/ui";
import type { CompatibilityResult } from "@wps/contracts";
import { PageContainer } from "../../../../components/layout/page-container";
import {
  useAssignLegacyProduction,
  useLegacyProductionAssignmentHistory,
  useLegacyProductionRecord,
  useUnassignLegacyProduction,
  useValidateLegacyAssignment,
} from "../../../../hooks/use-legacy-production";
import { useWorkOrders } from "../../../../hooks/use-work-orders";
import { ApiError } from "../../../../types/api";

export default function LegacyProductionDetailPage() {
  const params = useParams<{ id: string }>();
  const record = useLegacyProductionRecord(params.id);
  const history = useLegacyProductionAssignmentHistory(params.id);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassignReason, setUnassignReason] = useState("");
  const [unassignOpen, setUnassignOpen] = useState(false);
  const unassign = useUnassignLegacyProduction(params.id);
  const toast = useToast();

  if (record.isLoading || !record.data) {
    return (
      <PageContainer title="Legacy Production">
        <LoadingSkeleton rows={6} />
      </PageContainer>
    );
  }

  const data = record.data;

  return (
    <PageContainer title={data.legacyReferenceNumber} description="Data simulasi produksi lama.">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Data Dummy</span>
        <span
          className={
            data.assignmentStatus === "ASSIGNED"
              ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
              : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
          }
        >
          {data.assignmentStatus}
        </span>
      </div>

      <div className="mb-4 flex gap-2">
        {data.assignmentStatus === "UNASSIGNED" ? (
          <Button onClick={() => setAssignOpen(true)}>Assign ke SPK</Button>
        ) : (
          <Button variant="danger" onClick={() => setUnassignOpen(true)}>
            Unassign
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Detail Legacy</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Jenis Proses" value={data.processType.replaceAll("_", " ")} />
            <Row label="Spesies" value={data.woodSpecies} />
            <Row label="Dimensi" value={data.dimensions} />
            <Row label="Grade" value={data.grade} />
            <Row label="Tanggal Produksi" value={new Date(data.legacyProductionDate).toLocaleDateString("id-ID")} />
            <Row label="Mesin" value={data.machineDisplay} />
            <Row label="Operator" value={data.operatorDisplay} />
            <Row label="Status Asli" value={data.originalStatus} />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Kuantitas</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Planned" value={`${data.plannedQuantity} ${data.uomCode}`} />
            <Row label="Input" value={`${data.inputQuantity} ${data.uomCode}`} />
            <Row label="Output" value={`${data.outputQuantity} ${data.uomCode}`} />
            <Row label="Good" value={`${data.goodQuantity} ${data.uomCode}`} />
            <Row label="Rework" value={`${data.reworkQuantity} ${data.uomCode}`} />
            <Row label="Reject" value={`${data.rejectQuantity} ${data.uomCode}`} />
            <Row label="Loss" value={`${data.lossQuantity} ${data.uomCode}`} />
          </dl>
        </section>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Riwayat Assignment</h2>
        <div className="mt-3 space-y-2">
          {!history.data?.length ? (
            <p className="text-sm text-slate-400">Belum pernah ditugaskan.</p>
          ) : (
            history.data.map((assignment) => (
              <div key={assignment.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-medium text-slate-800">
                  Work Order: {assignment.workOrderId} — Qty: {assignment.assignedQuantity}
                </p>
                <p className="text-xs text-slate-500">
                  Ditugaskan {new Date(assignment.assignedAt).toLocaleString("id-ID")}
                  {assignment.unassignedAt
                    ? ` · Dilepas ${new Date(assignment.unassignedAt).toLocaleString("id-ID")} (${assignment.unassignedReason})`
                    : ""}
                </p>
                {assignment.overrideReason ? (
                  <p className="text-xs text-amber-600">Override: {assignment.overrideReason}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      {assignOpen ? <AssignDialog recordId={data.id} onClose={() => setAssignOpen(false)} /> : null}

      <Modal open={unassignOpen} onClose={() => setUnassignOpen(false)} size="sm">
        <h2 className="text-base font-semibold text-slate-900">Unassign Legacy Production</h2>
        <Field label="Alasan" required>
          <Input value={unassignReason} onChange={(e) => setUnassignReason(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setUnassignOpen(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!unassignReason.trim()}
            loading={unassign.isPending}
            onClick={() =>
              unassign.mutate(
                { reason: unassignReason },
                {
                  onSuccess: () => {
                    toast.success("Unassign berhasil");
                    setUnassignOpen(false);
                    setUnassignReason("");
                  },
                  onError: (error) => toast.error("Gagal unassign", error instanceof ApiError ? error.message : undefined),
                },
              )
            }
          >
            Konfirmasi
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function AssignDialog({ recordId, onClose }: { recordId: string; onClose: () => void }) {
  const toast = useToast();
  const workOrders = useWorkOrders();
  const validate = useValidateLegacyAssignment(recordId);
  const assign = useAssignLegacyProduction(recordId);
  const [workOrderId, setWorkOrderId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [overrideReason, setOverrideReason] = useState("");
  const [result, setResult] = useState<CompatibilityResult | null>(null);

  const runValidate = () => {
    if (!workOrderId || !quantity) return;
    validate.mutate(
      { workOrderId, assignedQuantity: Number(quantity) },
      {
        onSuccess: (data) => setResult(data),
        onError: (error) => toast.error("Gagal validasi", error instanceof ApiError ? error.message : undefined),
      },
    );
  };

  const canAssign = Boolean(result) && result!.blockingErrors.length === 0;
  const needsOverride = Boolean(result) && result!.warnings.length > 0;

  return (
    <Modal open onClose={onClose} size="lg">
      <h2 className="text-lg font-semibold text-slate-900">Assign ke SPK / Work Order</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Work Order">
          <select
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            value={workOrderId}
            onChange={(e) => {
              setWorkOrderId(e.target.value);
              setResult(null);
            }}
          >
            <option value="">Pilih Work Order</option>
            {workOrders.data?.items.map((wo) => (
              <option key={wo.id} value={wo.id}>
                {wo.workOrderNumber}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Assigned Quantity">
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setResult(null);
            }}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Button type="button" variant="secondary" loading={validate.isPending} onClick={runValidate} disabled={!workOrderId}>
          Validasi
        </Button>
      </div>

      {result ? (
        <div className="mt-4 space-y-2 rounded-lg border border-slate-100 p-3 text-sm">
          <p>Item cocok: {result.itemMatch ? "Ya" : "Tidak"}</p>
          <p>UOM cocok: {result.uomMatch ? "Ya" : "Tidak"}</p>
          <p>Proses cocok: {result.processMatch ? "Ya" : "Tidak"}</p>
          {result.blockingErrors.map((error) => (
            <p key={error} className="font-medium text-rose-600">
              {error}
            </p>
          ))}
          {result.warnings.map((warning) => (
            <p key={warning} className="text-amber-600">
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      {needsOverride ? (
        <div className="mt-3">
          <Field label="Alasan Override" required hint="Hanya supervisor berizin yang dapat override.">
            <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          </Field>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          Batal
        </Button>
        <Button
          disabled={!canAssign || (needsOverride && !overrideReason.trim())}
          loading={assign.isPending}
          onClick={() =>
            assign.mutate(
              { workOrderId, assignedQuantity: Number(quantity), overrideReason: overrideReason || undefined },
              {
                onSuccess: () => {
                  toast.success("Assignment berhasil");
                  onClose();
                },
                onError: (error) => toast.error("Gagal assign", error instanceof ApiError ? error.message : undefined),
              },
            )
          }
        >
          Konfirmasi Assign
        </Button>
      </div>
    </Modal>
  );
}
