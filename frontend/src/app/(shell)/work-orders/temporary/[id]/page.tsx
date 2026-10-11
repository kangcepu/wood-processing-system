"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, Field, Input, LoadingSkeleton, useToast } from "@wps/ui";
import type { TemporarySpkAction } from "@wps/contracts";
import { PageContainer } from "../../../../../components/layout/page-container";
import { StatusBadge } from "../../../../../components/status-badge";
import { useBuyerOrder } from "../../../../../hooks/use-buyer-orders";
import {
  useAddFeasibilityScenario,
  useConvertTemporarySpk,
  useSelectFeasibilityScenario,
  useTemporarySpk,
  useTemporarySpkAction,
} from "../../../../../hooks/use-temporary-spk";
import { useItemReferences } from "../../../../../hooks/use-catalog";
import { ApiError } from "../../../../../types/api";

const NEXT_ACTIONS: Record<string, { action: TemporarySpkAction; label: string }[]> = {
  DRAFT: [
    { action: "START_FEASIBILITY", label: "Mulai Feasibility" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  FEASIBILITY: [
    { action: "SUBMIT_FOR_REVIEW", label: "Ajukan Review" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  REVIEW: [
    { action: "REQUEST_BUYER_CONFIRMATION", label: "Minta Konfirmasi Buyer" },
    { action: "CANCEL", label: "Batalkan" },
  ],
  WAITING_BUYER_CONFIRMATION: [{ action: "CANCEL", label: "Batalkan" }],
};

export default function TemporarySpkDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const spk = useTemporarySpk(params.id);
  const buyerOrder = useBuyerOrder(spk.data?.buyerOrderId);
  const action = useTemporarySpkAction(params.id);
  const addScenario = useAddFeasibilityScenario(params.id);
  const selectScenario = useSelectFeasibilityScenario(params.id);
  const [scenarioName, setScenarioName] = useState("");

  if (spk.isLoading || !spk.data) {
    return (
      <PageContainer title="Temporary SPK">
        <LoadingSkeleton rows={6} />
      </PageContainer>
    );
  }

  const data = spk.data;
  const actions = NEXT_ACTIONS[data.status] ?? [];
  const canConvert = data.status === "WAITING_BUYER_CONFIRMATION" && buyerOrder.data?.status === "CONFIRMED";
  const hasSelectedScenario = data.scenarios.some((scenario) => scenario.isSelected);

  return (
    <PageContainer title={data.spkNumber} description="Feasibility SPK Sementara — tidak mengotorisasi produksi.">
      <div className="mb-4 flex items-center gap-3">
        <StatusBadge status={data.status} />
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
                { onError: (error) => toast.error("Gagal", error instanceof ApiError ? error.message : undefined) },
              )
            }
          >
            {label}
          </Button>
        ))}
      </div>

      <section className="card p-5">
        <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Skenario Feasibility</h2>
        <div className="mt-3 space-y-2">
          {data.scenarios.map((scenario) => (
            <div key={scenario.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  #{scenario.scenarioNo} {scenario.name} {scenario.isSelected ? "(Terpilih)" : ""}
                </p>
              </div>
              {!scenario.isSelected ? (
                <Button
                  variant="secondary"
                  loading={selectScenario.isPending}
                  onClick={() => selectScenario.mutate(scenario.id)}
                >
                  Pilih
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        {data.status !== "CONVERTED" && data.status !== "CANCELLED" ? (
          <div className="mt-4 flex items-end gap-2 border-t border-slate-100 pt-4">
            <Field label="Nama Skenario Baru">
              <Input value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} />
            </Field>
            <Button
              loading={addScenario.isPending}
              onClick={() => {
                if (!scenarioName.trim()) return;
                addScenario.mutate(
                  { name: scenarioName, assumptions: {}, result: {} },
                  { onSuccess: () => setScenarioName("") },
                );
              }}
            >
              Tambah
            </Button>
          </div>
        ) : null}
      </section>

      {canConvert ? <ConvertSection temporarySpkId={data.id} disabled={!hasSelectedScenario} /> : null}
      {!canConvert && data.status === "WAITING_BUYER_CONFIRMATION" ? (
        <p className="mt-4 text-sm text-amber-600">
          Buyer order belum berstatus CONFIRMED, konversi ke Work Order belum bisa dilakukan.
        </p>
      ) : null}
    </PageContainer>
  );
}

function ConvertSection({ temporarySpkId, disabled }: { temporarySpkId: string; disabled: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const items = useItemReferences();
  const convert = useConvertTemporarySpk(temporarySpkId);
  const [itemReferenceId, setItemReferenceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [destination, setDestination] = useState("");

  const submit = () => {
    convert.mutate(
      {
        itemReferenceId,
        quantity: Number(quantity),
        uomCode: "M3",
        dueDate: new Date(dueDate).toISOString(),
        destination,
        priority: "NORMAL",
        routingVersionLabel: "ROUTING-DEFAULT",
        operations: [{ sequenceNo: 1, processType: "SAWMILL", name: "Sawmill" }],
      },
      {
        onSuccess: (workOrder) => {
          toast.success("Dikonversi ke Work Order", workOrder.workOrderNumber);
          router.push(`/work-orders/${workOrder.id}`);
        },
        onError: (error) => toast.error("Gagal konversi", error instanceof ApiError ? error.message : undefined),
      },
    );
  };

  return (
    <section className="card mt-4 p-5">
      <h2 className="border-b border-slate-200 pb-3 text-base font-semibold text-slate-900">Konversi ke Work Order</h2>
      {disabled ? <p className="mt-3 text-sm text-amber-600">Pilih skenario feasibility sebelum konversi.</p> : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Item">
          <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" value={itemReferenceId} onChange={(e) => setItemReferenceId(e.target.value)}>
            <option value="">Pilih item</option>
            {items.data?.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity">
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </Field>
        <Field label="Jatuh Tempo">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Destinasi">
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
        <Button
          disabled={disabled || !itemReferenceId || !dueDate || !destination}
          loading={convert.isPending}
          onClick={submit}
        >
          Konversi ke Work Order
        </Button>
      </div>
    </section>
  );
}
