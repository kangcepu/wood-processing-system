"use client";

import { useQuery } from "@tanstack/react-query";
import type { CustomerReference, ItemReference } from "@wps/contracts";
import { apiGet } from "../lib/api-client";

interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export function useCustomerReferences() {
  return useQuery({
    queryKey: ["references", "customers"],
    queryFn: () => apiGet<PaginatedResult<CustomerReference>>("/references/customers", { pageSize: 100 }),
  });
}

export function useItemReferences() {
  return useQuery({
    queryKey: ["references", "items"],
    queryFn: () => apiGet<PaginatedResult<ItemReference>>("/references/items", { pageSize: 100 }),
  });
}
