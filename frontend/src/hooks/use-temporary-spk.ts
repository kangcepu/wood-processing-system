"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateFeasibilityScenarioRequest,
  CreateTemporarySpkRequest,
  CreateWorkOrderRequest,
  TemporarySpk,
  TemporarySpkActionRequest,
  WorkOrder,
} from "@wps/contracts";
import { apiGet, apiPost } from "../lib/api-client";

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useTemporarySpkList(search?: string) {
  return useQuery({
    queryKey: ["temporary-spk", search],
    queryFn: () => apiGet<PaginatedResult<TemporarySpk>>("/temporary-spk", { search, pageSize: 50 }),
  });
}

export function useTemporarySpk(id: string | undefined) {
  return useQuery({
    queryKey: ["temporary-spk", "detail", id],
    queryFn: () => apiGet<TemporarySpk>(`/temporary-spk/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateTemporarySpk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemporarySpkRequest) => apiPost<TemporarySpk>("/temporary-spk", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["temporary-spk"] }),
  });
}

export function useTemporarySpkAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemporarySpkActionRequest) => apiPost<TemporarySpk>(`/temporary-spk/${id}/actions`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["temporary-spk"] });
      void queryClient.invalidateQueries({ queryKey: ["temporary-spk", "detail", id] });
    },
  });
}

export function useAddFeasibilityScenario(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFeasibilityScenarioRequest) =>
      apiPost<TemporarySpk>(`/temporary-spk/${id}/scenarios`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["temporary-spk", "detail", id] }),
  });
}

export function useSelectFeasibilityScenario(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => apiPost<TemporarySpk>(`/temporary-spk/${id}/scenarios/${scenarioId}/select`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["temporary-spk", "detail", id] }),
  });
}

export function useConvertTemporarySpk(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<CreateWorkOrderRequest, "buyerOrderId">) =>
      apiPost<WorkOrder>(`/temporary-spk/${id}/convert`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["temporary-spk"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}
