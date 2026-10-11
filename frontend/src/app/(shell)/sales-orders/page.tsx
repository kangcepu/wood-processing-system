"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBuyerOrderRequestSchema, type CreateBuyerOrderRequest } from "@wps/contracts";
import { Button, EmptyState, Field, Input, LoadingSkeleton, Modal, useToast } from "@wps/ui";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "../../../components/layout/page-container";
import { StatusBadge } from "../../../components/status-badge";
import { useBuyerOrders, useCreateBuyerOrder } from "../../../hooks/use-buyer-orders";
import { useCustomerReferences, useItemReferences } from "../../../hooks/use-catalog";
import { ApiError } from "../../../types/api";

export default function SalesOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const orders = useBuyerOrders(search || undefined);

  return (
    <PageContainer title="Sales & Orders" description="Buyer order dan requirement operasional pelanggan.">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Input placeholder="Cari order number / PO buyer" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Buat Order
        </Button>
      </div>

      {orders.isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : !orders.data?.items.length ? (
        <EmptyState title="Belum ada buyer order" description="Klik Buat Order untuk membuat buyer order baru." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order Number</th>
                <th className="px-4 py-3">PO Buyer</th>
                <th className="px-4 py-3">Destinasi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.data.items.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/sales-orders/${order.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{order.buyerPoNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{order.destination}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(order.deliveryDate).toLocaleDateString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateBuyerOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </PageContainer>
  );
}

function CreateBuyerOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const create = useCreateBuyerOrder();
  const customers = useCustomerReferences();
  const items = useItemReferences();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBuyerOrderRequest>({
    resolver: zodResolver(createBuyerOrderRequestSchema),
    defaultValues: {
      buyerPoNumber: "",
      customerReferenceId: "",
      destination: "",
      deliveryDate: "",
      lines: [{ itemReferenceId: "", woodSpecies: "", dimension: "", grade: "", quantity: 1, uomCode: "M3" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });

  const onSubmit = handleSubmit((values) => {
    const payload: CreateBuyerOrderRequest = {
      ...values,
      deliveryDate: new Date(values.deliveryDate).toISOString(),
    };
    create.mutate(payload, {
      onSuccess: (order) => {
        toast.success("Buyer order dibuat", order.orderNumber);
        reset();
        onClose();
        router.push(`/sales-orders/${order.id}`);
      },
      onError: (error) => toast.error("Gagal membuat order", error instanceof ApiError ? error.message : undefined),
    });
  });

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <h2 className="text-lg font-semibold text-slate-900">Buat Buyer Order</h2>
      <form className="mt-4 space-y-4" onSubmit={(event) => void onSubmit(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="PO Buyer" required error={errors.buyerPoNumber?.message}>
            <Input {...register("buyerPoNumber")} />
          </Field>
          <Field label="Pelanggan" required error={errors.customerReferenceId?.message}>
            <select className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" {...register("customerReferenceId")}>
              <option value="">Pilih pelanggan</option>
              {customers.data?.items.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Destinasi" required error={errors.destination?.message}>
            <Input {...register("destination")} />
          </Field>
          <Field label="Tanggal Pengiriman" required error={errors.deliveryDate?.message}>
            <Input type="date" {...register("deliveryDate")} />
          </Field>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">Baris Item</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({ itemReferenceId: "", woodSpecies: "", dimension: "", grade: "", quantity: 1, uomCode: "M3" })
              }
            >
              <Plus className="h-4 w-4" />
              Tambah Baris
            </Button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-6 gap-2 rounded-lg border border-slate-100 p-3">
                <select
                  className="col-span-2 h-9 rounded-md border border-slate-300 px-2 text-xs"
                  {...register(`lines.${index}.itemReferenceId`)}
                >
                  <option value="">Item</option>
                  {items.data?.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <Input placeholder="Spesies" className="text-xs" {...register(`lines.${index}.woodSpecies`)} />
                <Input placeholder="Dimensi" className="text-xs" {...register(`lines.${index}.dimension`)} />
                <Input placeholder="Grade" className="text-xs" {...register(`lines.${index}.grade`)} />
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="text-xs"
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                    aria-label="Hapus baris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {errors.lines?.message ? <p className="mt-2 text-xs text-rose-600">{errors.lines.message}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={create.isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
