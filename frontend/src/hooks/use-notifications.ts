"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "../lib/api-client";

export interface NotificationSummary {
  unreadCount: number;
}

export function useNotificationSummary() {
  return useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: () => apiGet<NotificationSummary>("/notifications/summary").then((data) => ({ data })),
    refetchInterval: 30_000,
  });
}
