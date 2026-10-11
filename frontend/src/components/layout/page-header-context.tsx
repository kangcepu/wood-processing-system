"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface PageHeader {
  title: string;
}

interface PageHeaderContextValue {
  header: PageHeader;
  setHeader: (header: PageHeader) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue>({
  header: { title: "" },
  setHeader: () => undefined,
});

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeader>({ title: "" });
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <PageHeaderContext.Provider value={value}>{children}</PageHeaderContext.Provider>;
}

export function usePageHeader(): PageHeaderContextValue {
  return useContext(PageHeaderContext);
}
