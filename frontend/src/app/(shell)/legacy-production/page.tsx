"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, LoadingSkeleton, useToast } from "@wps/ui";
import type { LegacyAssignmentStatus } from "@wps/contracts";
import { RefreshCw } from "lucide-react";
import { PageContainer } from "../../../components/layout/page-container";
import { useLegacyProductionList, useSeedLegacyProduction } from "../../../hooks/use-legacy-production";
import { ApiError } from "../../../types/api";

export default function LegacyProductionPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState<LegacyAssignmentStatus | undefined>(undefined);
  const list = useLegacyProductionList({ search: search || undefined, assignmentStatus });
  const seed = useSeedLegacyProduction();

  return (
    <PageContainer
      title="Legacy Production Dummy"
      description="Data simulasi produksi lama untuk demonstrasi — bukan data produksi native."
    >
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
        Seluruh data pada halaman ini bertanda <strong>Data Dummy</strong> dan tidak memengaruhi stock, genealogy,
        atau KPI native.
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <input
            placeholder="Cari nomor referensi legacy"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-64 rounded-lg border border-slate-300 px-3 text-sm"
          />
          <select
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
            value={assignmentStatus ?? ""}
            onChange={(e) => setAssignmentStatus((e.target.value || undefined) as LegacyAssignmentStatus | undefined)}
          >
            <option value="">Semua Status</option>
            <option value="UNASSIGNED">Belum Ditugaskan</option>
            <option value="ASSIGNED">Sudah Ditugaskan</option>
          </select>
        </div>
        <Button
          variant="secondary"
          loading={seed.isPending}
          onClick={() =>
            seed.mutate(undefined, {
              onSuccess: (result) => toast.success("Dummy data di-generate", `${result.createdCount} data baru dibuat`),
              onError: (error) => toast.error("Gagal generate dummy data", error instanceof ApiError ? error.message : undefined),
            })
          }
        >
          <RefreshCw className="h-4 w-4" />
          Generate Dummy Data
        </Button>
      </div>

      {list.isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : !list.data?.items.length ? (
        <EmptyState title="Belum ada data legacy production" description="Klik Generate Dummy Data untuk membuat data contoh." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">No. Referensi</th>
                <th className="px-4 py-3">Proses</th>
                <th className="px-4 py-3">Output</th>
                <th className="px-4 py-3">Status Assignment</th>
                <th className="px-4 py-3">Sumber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.items.map((record) => (
                <tr
                  key={record.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/legacy-production/${record.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{record.legacyReferenceNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{record.processType.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {record.outputQuantity} {record.uomCode}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        record.assignmentStatus === "ASSIGNED"
                          ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {record.assignmentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Data Dummy
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
