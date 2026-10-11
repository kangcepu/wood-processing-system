"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  IntegrationSettingResponse,
  StorageSettingResponse,
  TestStorageConnectionResult,
  UpdateIntegrationSettingRequest,
  UpdateStorageSettingRequest,
} from "@wps/contracts";
import { apiGet, apiPost, apiPut } from "../lib/api-client";

export function useStorageSetting() {
  return useQuery({
    queryKey: ["settings", "storage"],
    queryFn: () => apiGet<StorageSettingResponse>("/settings/storage"),
  });
}

export function useUpdateStorageSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateStorageSettingRequest) => apiPut<StorageSettingResponse>("/settings/storage", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "storage"] }),
  });
}

export function useTestStorageConnection() {
  return useMutation({
    mutationFn: (payload: UpdateStorageSettingRequest) =>
      apiPost<TestStorageConnectionResult>("/settings/storage/test-connection", payload),
  });
}

export function useIntegrationSettings() {
  return useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: () => apiGet<IntegrationSettingResponse[]>("/settings/integrations"),
  });
}

export function useUpdateIntegrationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ system, payload }: { system: string; payload: UpdateIntegrationSettingRequest }) =>
      apiPut<IntegrationSettingResponse>(`/settings/integrations/${system}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings", "integrations"] }),
  });
}
