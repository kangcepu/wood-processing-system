"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BuyerOrder,
  BuyerOrderActionRequest,
  CreateBuyerOrderRequest,
  CustomerRequirementRevision,
  UpdateBuyerOrderLinesRequest,
} from "@wps/contracts";
import { apiGet, apiPatch, apiPost } from "../lib/api-client";

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useBuyerOrders(search?: string) {
  return useQuery({
    queryKey: ["orders", search],
    queryFn: () => apiGet<PaginatedResult<BuyerOrder>>("/orders", { search, pageSize: 50 }),
  });
}

export function useBuyerOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "detail", id],
    queryFn: () => apiGet<BuyerOrder>(`/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useBuyerOrderRevisions(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", "revisions", id],
    queryFn: () => apiGet<CustomerRequirementRevision[]>(`/orders/${id}/revisions`),
    enabled: Boolean(id),
  });
}

export function useCreateBuyerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBuyerOrderRequest) => apiPost<BuyerOrder>("/orders", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateBuyerOrderLines(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBuyerOrderLinesRequest) => apiPatch<BuyerOrder>(`/orders/${id}/lines`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "revisions", id] });
    },
  });
}

export function useBuyerOrderAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BuyerOrderActionRequest) => apiPost<BuyerOrder>(`/orders/${id}/actions`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orders", "detail", id] });
    },
  });
}
