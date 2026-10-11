"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button, Field, Input, LoadingSkeleton, Modal, useToast } from "@wps/ui";
import type { WorkOrderAction } from "@wps/contracts";
import { PageContainer } from "../../../../components/layout/page-container";
import { StatusBadge } from "../../../../components/status-badge";
import { useWorkOrder, useWorkOrderAction } from "../../../../hooks/use-work-orders";
import { useWorkOrderLegacyActivity } from "../../../../hooks/use-legacy-production";
import { ApiError } from "../../../../types/api";

const NEXT_ACTIONS: Record<string, { action: WorkOrderAction; label: string; needsReason?: boolean }[]> = {
  DRAFT: [
    { action: "SUBMIT_FOR_REVIEW", label: "Ajukan Review" },
    { action: "CANCEL", label: "Batalkan", needsReason: true },
  ],
  REVIEW: [
    { action: "APPROVE", label: "Approve" },
    { action: "REJECT", label: "Tolak", needsReason: true },
    { action: "CANCEL", label: "Batalkan", needsReason: true },
  ],
  APPROVED: [
    { action: "RELEASE", label: "Rilis Work Order" },
    { action: "CANCEL", label: "Batalkan", needsReason: true },
  ],
  RELEASED: [
    { action: "HOLD", label: "Hold", needsReason: true },
    { action: "CANCEL", label: "Batalkan", needsReason: true },
  ],
  HOLD: [{ action: "RESUME", label: "Lanjutkan" }],
};

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const workOrder = useWorkOrder(params.id);
  const action = useWorkOrderAction(params.id);
  const legacyActivity = useWorkOrderLegacyActivity(params.id);
  const [pendingAction, setPendingAction] = useState<{ action: WorkOrderAction; label: string } | null>(null);
  const [reason, setReason] = useState("");

  if (workOrder.isLoading || !workOrder.data) {
    return (
      <PageContainer title="Work Order">
        <LoadingSkeleton rows={6} />
      </PageContainer>
    );
  }

  const data = workOrder.data;
  const actions = NEXT_ACTIONS[data.status] ?? [];

  const runAction = (actionName: WorkOrderAction, actionReason?: string) => {
    action.mutate(
      { action: actionName, reason: actionReason },
      {
        onSuccess: () => {
          toast.success("Status Work Order diperbarui");
          setPendingAction(null);
          setReason("");
        },
        onError: (error) => toast.error("Gagal", error instanceof ApiError ? error.message : undefined),
      },
    );
  };

  return (
    <PageContainer title={data.workOrderNumber} description="SPK / Work Order — otorisasi produksi.">
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={data.status} />
        {data.blockingReason ? <span className="text-sm text-rose-600">Alasan: {data.blockingReason}</span> : null}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {actions.map(({ action: actionName, label, needsReason }) => (
          <Button
            key={actionName}
            variant={actionName === "CANCEL" || actionName === "REJECT" || actionName === "HOLD" ? "danger" : "primary"}
            loading={action.isPending}
            onClick={() => (needsReason ? setPendingAction({ action: actionName, label }) : runAction(actionName))}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="card p-5">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Informasi Umum</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Buyer Order" value={data.buyerOrderId} />
            <Row label="Temporary SPK" value={data.temporarySpkId ?? "-"} />
            <Row label="Revisi Requirement" value={String(data.requirementRevisionNo)} />
            <Row label="Quantity" value={`${data.quantity} ${data.uomCode}`} />
            <Row label="Jatuh Tempo" value={new Date(data.dueDate).toLocaleDateString("id-ID")} />
            <Row label="Destinasi" value={data.destination} />
            <Row label="Prioritas" value={data.priority} />
            <Row label="Routing" value={data.routingVersionLabel} />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Kuantitas Progres</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Planned" value={String(data.plannedQuantity)} />
            <Row label="Actual" value={String(data.actualQuantity)} />
            <Row label="Good" value={String(data.goodQuantity)} />
            <Row label="Rework" value={String(data.reworkQuantity)} />
            <Row label="Reject" value={String(data.rejectQuantity)} />
            <Row label="Loss" value={String(data.lossQuantity)} />
            <Row label="Packed" value={String(data.packedQuantity)} />
            <Row label="Shipped" value={String(data.shippedQuantity)} />
          </dl>
        </section>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Tahapan Proses</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="py-2">#</th>
              <th className="py-2">Proses</th>
              <th className="py-2">Nama</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.operations.map((op) => (
              <tr key={op.id}>
                <td className="py-2">{op.sequenceNo}</td>
                <td className="py-2">{op.processType}</td>
                <td className="py-2">{op.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Aktivitas Legacy</h2>
        {!legacyActivity.data?.assignments.length ? (
          <p className="mt-3 text-sm text-slate-400">Belum ada aktivitas legacy yang ditugaskan ke Work Order ini.</p>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-600">
              Total quantity legacy (terpisah dari progres native):{" "}
              <span className="font-semibold">{legacyActivity.data.totalAssignedQuantity}</span>
            </p>
            <div className="mt-3 space-y-2">
              {legacyActivity.data.assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{assignment.legacyReferenceNumber}</p>
                    <p className="text-xs text-slate-500">
                      {assignment.processType.replaceAll("_", " ")} · Qty {assignment.assignedQuantity}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    Legacy Dummy
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <Modal open={Boolean(pendingAction)} onClose={() => setPendingAction(null)} size="sm">
        <h2 className="text-base font-semibold text-slate-900">{pendingAction?.label}</h2>
        <Field label="Alasan" required>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingAction(null)}>
            Batal
          </Button>
          <Button
            variant="danger"
            disabled={!reason.trim()}
            loading={action.isPending}
            onClick={() => pendingAction && runAction(pendingAction.action, reason)}
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
