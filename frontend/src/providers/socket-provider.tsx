"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { getRealtimeUrl } from "../lib/env";
import { getAccessToken, subscribeAccessToken } from "../lib/token-store";
import { useAuthBootstrap } from "./auth-provider";
import { useMe } from "../hooks/use-auth";

type ConnectionState = "connecting" | "connected" | "disconnected";

const SocketContext = createContext<ConnectionState>("disconnected");

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isReady } = useAuthBootstrap();
  const { data: user } = useMe();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<ConnectionState>("disconnected");

  useEffect(() => {
    if (!isReady || !user) return;

    const token = getAccessToken();
    const socket = io(`${getRealtimeUrl()}/realtime`, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    setState("connecting");

    socket.on("connect", () => setState("connected"));
    socket.on("disconnect", () => setState("disconnected"));
    socket.on("notification.created", () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    const unsubscribe = subscribeAccessToken((nextToken) => {
      socket.auth = { token: nextToken };
    });

    return () => {
      unsubscribe();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isReady, user, queryClient]);

  return <SocketContext.Provider value={state}>{children}</SocketContext.Provider>;
}

export function useRealtimeConnectionState(): ConnectionState {
  return useContext(SocketContext);
}
