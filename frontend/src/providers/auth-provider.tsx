"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { bootstrapSession, ME_QUERY_KEY } from "../hooks/use-auth";

interface AuthBootstrapState {
  isReady: boolean;
}

const AuthBootstrapContext = createContext<AuthBootstrapState>({ isReady: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    void bootstrapSession().then((user) => {
      if (!active) return;
      queryClient.setQueryData(ME_QUERY_KEY, user);
      setIsReady(true);
    });
    return () => {
      active = false;
    };
  }, [queryClient]);

  return <AuthBootstrapContext.Provider value={{ isReady }}>{children}</AuthBootstrapContext.Provider>;
}

export function useAuthBootstrap(): AuthBootstrapState {
  return useContext(AuthBootstrapContext);
}
