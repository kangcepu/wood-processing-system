"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AssignLegacyProductionRequest,
  CompatibilityResult,
  LegacyActivity,
  LegacyAssignmentStatus,
  LegacyProductionAssignment,
  LegacyProductionRecord,
  UnassignLegacyProductionRequest,
  ValidateAssignmentRequest,
} from "@wps/contracts";
import { apiGet, apiPost } from "../lib/api-client";

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useLegacyProductionList(params: { search?: string; assignmentStatus?: LegacyAssignmentStatus }) {
  return useQuery({
    queryKey: ["legacy-production", params],
    queryFn: () =>
      apiGet<PaginatedResult<LegacyProductionRecord>>("/legacy-production", {
        search: params.search,
        assignmentStatus: params.assignmentStatus,
        pageSize: 50,
      }),
  });
}

export function useLegacyProductionRecord(id: string | undefined) {
  return useQuery({
    queryKey: ["legacy-production", "detail", id],
    queryFn: () => apiGet<LegacyProductionRecord>(`/legacy-production/${id}`),
    enabled: Boolean(id),
  });
}

export function useLegacyProductionAssignmentHistory(id: string | undefined) {
  return useQuery({
    queryKey: ["legacy-production", "history", id],
    queryFn: () => apiGet<LegacyProductionAssignment[]>(`/legacy-production/${id}/assignment-history`),
    enabled: Boolean(id),
  });
}

export function useSeedLegacyProduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ createdCount: number; seedBatch: string }>("/legacy-production/seed"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["legacy-production"] }),
  });
}

export function useValidateLegacyAssignment(id: string) {
  return useMutation({
    mutationFn: (payload: ValidateAssignmentRequest) =>
      apiPost<CompatibilityResult>(`/legacy-production/${id}/validate-assignment`, payload),
  });
}

export function useAssignLegacyProduction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignLegacyProductionRequest) =>
      apiPost<LegacyProductionRecord>(`/legacy-production/${id}/assign`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legacy-production"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useUnassignLegacyProduction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UnassignLegacyProductionRequest) =>
      apiPost<LegacyProductionRecord>(`/legacy-production/${id}/unassign`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["legacy-production"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useWorkOrderLegacyActivity(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ["work-orders", "legacy-activity", workOrderId],
    queryFn: () => apiGet<LegacyActivity>(`/work-orders/${workOrderId}/legacy-activity`),
    enabled: Boolean(workOrderId),
  });
}
