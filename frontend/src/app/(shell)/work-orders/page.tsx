"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, LoadingSkeleton, useToast } from "@wps/ui";
import { cn } from "@wps/ui";
import { PageContainer } from "../../../components/layout/page-container";
import { StatusBadge } from "../../../components/status-badge";
import { useBuyerOrders } from "../../../hooks/use-buyer-orders";
import { useCreateTemporarySpk, useTemporarySpkList } from "../../../hooks/use-temporary-spk";
import { useWorkOrders } from "../../../hooks/use-work-orders";
import { ApiError } from "../../../types/api";

type Tab = "temporary" | "real";

export default function WorkOrderHubPage() {
  const [tab, setTab] = useState<Tab>("real");

  return (
    <PageContainer title="SPK / Work Order" description="Feasibility SPK Sementara dan otorisasi produksi Work Order.">
      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === "real"} onClick={() => setTab("real")}>
          Work Order
        </TabButton>
        <TabButton active={tab === "temporary"} onClick={() => setTab("temporary")}>
          SPK Sementara
        </TabButton>
      </div>

      {tab === "real" ? <WorkOrderList /> : <TemporarySpkList />}
    </PageContainer>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2 text-sm font-medium",
        active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

function WorkOrderList() {
  const router = useRouter();
  const workOrders = useWorkOrders();

  if (workOrders.isLoading) return <LoadingSkeleton rows={6} />;
  if (!workOrders.data?.items.length) {
    return <EmptyState title="Belum ada Work Order" description="Work Order dibuat langsung atau melalui konversi SPK Sementara." />;
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">WO Number</th>
            <th className="px-4 py-3">Item</th>
            <th className="px-4 py-3">Qty</th>
            <th className="px-4 py-3">Jatuh Tempo</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {workOrders.data.items.map((wo) => (
            <tr key={wo.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/work-orders/${wo.id}`)}>
              <td className="px-4 py-3 font-medium text-slate-800">{wo.workOrderNumber}</td>
              <td className="px-4 py-3 text-slate-600">{wo.itemReferenceId}</td>
              <td className="px-4 py-3 text-slate-600">
                {wo.quantity} {wo.uomCode}
              </td>
              <td className="px-4 py-3 text-slate-600">{new Date(wo.dueDate).toLocaleDateString("id-ID")}</td>
              <td className="px-4 py-3">
                <StatusBadge status={wo.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemporarySpkList() {
  const router = useRouter();
  const toast = useToast();
  const spkList = useTemporarySpkList();
  const buyerOrders = useBuyerOrders("CONFIRMED");
  const create = useCreateTemporarySpk();

  if (spkList.isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Feasibility SPK Sementara tidak mengotorisasi produksi.</p>
        <select
          className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
          defaultValue=""
          onChange={(e) => {
            const buyerOrderId = e.target.value;
            if (!buyerOrderId) return;
            create.mutate(
              { buyerOrderId },
              {
                onSuccess: (spk) => {
                  toast.success("Temporary SPK dibuat", spk.spkNumber);
                  router.push(`/work-orders/temporary/${spk.id}`);
                },
                onError: (error) => toast.error("Gagal", error instanceof ApiError ? error.message : undefined),
              },
            );
            e.target.value = "";
          }}
        >
          <option value="">+ Buat SPK dari Buyer Order (CONFIRMED)</option>
          {buyerOrders.data?.items.map((order) => (
            <option key={order.id} value={order.id}>
              {order.orderNumber}
            </option>
          ))}
        </select>
      </div>

      {!spkList.data?.items.length ? (
        <EmptyState title="Belum ada Temporary SPK" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SPK Number</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {spkList.data.items.map((spk) => (
                <tr
                  key={spk.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/work-orders/temporary/${spk.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{spk.spkNumber}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={spk.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
