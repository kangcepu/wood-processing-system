"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuthUser, LoginRequest, LoginResponse, Session } from "@wps/contracts";
import { apiGet, apiPost } from "../lib/api-client";
import { setAccessToken } from "../lib/token-store";

export const ME_QUERY_KEY = ["me"] as const;

export function useMe() {
  return useQuery<AuthUser | null>({
    queryKey: ME_QUERY_KEY,
    queryFn: () => apiGet<AuthUser>("/profile"),
    retry: false,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoginRequest) => apiPost<LoginResponse>("/auth/login", payload),
    onSuccess: (result) => {
      setAccessToken(result.accessToken);
      queryClient.setQueryData(ME_QUERY_KEY, result.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<void>("/auth/logout"),
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
    },
  });
}

export function useLogoutAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<void>("/auth/logout-all"),
    onSuccess: () => {
      setAccessToken(null);
      queryClient.setQueryData(ME_QUERY_KEY, null);
    },
  });
}

export function useSessions() {
  return useQuery<Session[]>({
    queryKey: ["sessions"],
    queryFn: () => apiGet<Session[]>("/auth/sessions"),
  });
}

export async function bootstrapSession(): Promise<AuthUser | null> {
  try {
    const result = await apiPost<LoginResponse>("/auth/refresh");
    setAccessToken(result.accessToken);
    return result.user;
  } catch {
    setAccessToken(null);
    return null;
  }
}
