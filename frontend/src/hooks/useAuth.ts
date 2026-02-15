"use client";

import { useEffect, useState } from "react";
import { type AuthSession, getSession } from "../lib/auth";

/** Auth state hook — exposes current user, loading, authentication status. */
export function useAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  return {
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: !!session,
    loading,
  };
}
