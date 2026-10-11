"use client";

import { useQuery } from "@tanstack/react-query";

export interface Branding {
  app_name: string;
  app_subtitle: string;
  logo_url: string | null;
}

const DEFAULT_BRANDING: Branding = {
  app_name: "WPS",
  app_subtitle: "Wood Production System",
  logo_url: null,
};

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: () => Promise.resolve({ data: DEFAULT_BRANDING }),
    staleTime: Infinity,
  });
}
