"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChangePasswordRequest, NotificationPreferences, UpdateProfileRequest } from "@wps/contracts";
import { apiDelete, apiPatch, apiPost } from "../lib/api-client";
import { ME_QUERY_KEY } from "./use-auth";

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => apiPost<void>("/auth/change-password", payload),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => apiPatch("/profile", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}

export function useUploadMyAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      apiPost<{ url: string; expiresInSeconds: number }>("/profile/avatar", formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}

export function useRemoveMyAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<void>("/profile/avatar"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}

export function useUpdateNotificationPreferences() {
  return useMutation({
    mutationFn: (payload: NotificationPreferences) => apiPatch("/profile/notification-preferences", payload),
  });
}
