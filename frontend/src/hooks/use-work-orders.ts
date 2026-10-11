"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkOrderRequest, WorkOrder, WorkOrderActionRequest } from "@wps/contracts";
import { apiGet, apiPost } from "../lib/api-client";

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useWorkOrders(search?: string) {
  return useQuery({
    queryKey: ["work-orders", search],
    queryFn: () => apiGet<PaginatedResult<WorkOrder>>("/work-orders", { search, pageSize: 50 }),
  });
}

export function useWorkOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["work-orders", "detail", id],
    queryFn: () => apiGet<WorkOrder>(`/work-orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkOrderRequest) => apiPost<WorkOrder>("/work-orders", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["work-orders"] }),
  });
}

export function useWorkOrderAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WorkOrderActionRequest) => apiPost<WorkOrder>(`/work-orders/${id}/actions`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders", "detail", id] });
    },
  });
}
