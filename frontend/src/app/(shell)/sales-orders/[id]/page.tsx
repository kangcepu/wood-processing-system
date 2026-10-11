"use client";

import { useParams } from "next/navigation";
import { Button, LoadingSkeleton, useToast } from "@wps/ui";
import type { BuyerOrderAction } from "@wps/contracts";
import { PageContainer } from "../../../../components/layout/page-container";
import { StatusBadge } from "../../../../components/status-badge";
import { useBuyerOrder, useBuyerOrderAction, useBuyerOrderRevisions } from "../../../../hooks/use-buyer-orders";
import { ApiError } from "../../../../types/api";

const NEXT_ACTIONS: Record<string, { action: BuyerOrderAction; label: string }[]> = {
  DRAFT: [
    { action: "MOVE_TO_NEGOTIATION", label: "Mulai Negosiasi" },
    { action: "REQUEST_CONFIRMATION", label: "Minta Konfirmasi" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  NEGOTIATION: [
    { action: "REQUEST_CONFIRMATION", label: "Minta Konfirmasi" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  PENDING_CONFIRMATION: [
    { action: "CONFIRM", label: "Konfirmasi Order" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  CONFIRMED: [
    { action: "CLOSE", label: "Tutup Order" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  REVISED: [
    { action: "CONFIRM", label: "Konfirmasi Ulang" },
    { action: "CANCEL", label: "Batalkan" },
  ],
};

export default function BuyerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const order = useBuyerOrder(params.id);
  const revisions = useBuyerOrderRevisions(params.id);
  const action = useBuyerOrderAction(params.id);

  if (order.isLoading || !order.data) {
    return (
      <PageContainer title="Buyer Order">
        <LoadingSkeleton rows={6} />
      </PageContainer>
    );
  }

  const data = order.data;
  const actions = NEXT_ACTIONS[data.status] ?? [];

  return (
    <PageContainer title={data.orderNumber} description={`PO Buyer: ${data.buyerPoNumber}`}>
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={data.status} />
        <span className="text-sm text-slate-500">Revisi ke-{data.currentRevisionNo}</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {actions.map(({ action: actionName, label }) => (
          <Button
            key={actionName}
            variant={actionName === "CANCEL" ? "danger" : "primary"}
            loading={action.isPending}
            onClick={() =>
              action.mutate(
                { action: actionName, reason: actionName === "CANCEL" ? "Dibatalkan oleh pengguna" : undefined },
                {
                  onSuccess: () => toast.success("Status diperbarui"),
                  onError: (error) => toast.error("Gagal", error instanceof ApiError ? error.message : undefined),
                },
              )
            }
          >
            {label}
          </Button>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Baris Item</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="py-2">#</th>
              <th className="py-2">Spesies</th>
              <th className="py-2">Dimensi</th>
              <th className="py-2">Grade</th>
              <th className="py-2">Qty</th>
              <th className="py-2">UOM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.lines.map((line) => (
              <tr key={line.id}>
                <td className="py-2">{line.lineNo}</td>
                <td className="py-2">{line.woodSpecies}</td>
                <td className="py-2">{line.dimension}</td>
                <td className="py-2">{line.grade}</td>
                <td className="py-2">{line.quantity}</td>
                <td className="py-2">{line.uomCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Riwayat Revisi</h2>
        <div className="mt-3 space-y-2">
          {revisions.data?.map((revision) => (
            <div key={revision.id} className="rounded-lg border border-slate-100 p-3">
              <p className="text-sm font-medium text-slate-800">
                Revisi #{revision.revisionNo} {revision.impactAcknowledged ? "" : "(belum ack dampak)"}
              </p>
              <p className="text-xs text-slate-500">{revision.changeReason}</p>
              <p className="text-xs text-slate-400">{new Date(revision.createdAt).toLocaleString("id-ID")}</p>
            </div>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
