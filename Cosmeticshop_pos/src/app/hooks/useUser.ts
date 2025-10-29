"use client";

import { useSession } from "next-auth/react";

export function useUser() {
  const { data: session, status } = useSession();

  return {
    user: session?.user ?? null,
    role: session?.user.role ?? null,
    loading: status === "loading",
    authenticated: status === "authenticated",
    unauthenticated: status === "unauthenticated",
  };
}
