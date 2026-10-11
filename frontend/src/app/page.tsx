"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrap } from "../providers/auth-provider";
import { useMe } from "../hooks/use-auth";

export default function RootPage() {
  const router = useRouter();
  const { isReady } = useAuthBootstrap();
  const { data: user } = useMe();

  useEffect(() => {
    if (!isReady) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [isReady, user, router]);

  return null;
}
