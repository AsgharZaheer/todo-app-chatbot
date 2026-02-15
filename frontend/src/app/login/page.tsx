"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { signIn } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/tasks");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.push("/tasks");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-primary)" }}>
      {/* Left panel — gradient */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "var(--bg-gradient)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold text-white">Taskflow</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Stay organized,<br />achieve more.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            The smart way to manage your tasks. Create, prioritize, and track everything in one beautiful workspace.
          </p>
        </div>
        <p className="text-sm text-white/50 relative z-10">
          Hackathon Todo — Phase 2
        </p>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute bottom-20 left-20 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "var(--accent-gradient)" }}
            >
              T
            </div>
            <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Taskflow
            </span>
          </div>

          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Welcome back
          </h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div
              className="px-4 py-3 rounded-xl mb-6 text-sm font-medium"
              style={{
                background: "var(--status-danger-bg)",
                color: "var(--status-danger)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{
                  background: "var(--input-bg)",
                  borderColor: "var(--input-border)",
                  color: "var(--text-primary)",
                }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{
                background: "var(--accent-gradient)",
                boxShadow: "0 4px 15px var(--accent-primary-glow)",
              }}
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold"
              style={{ color: "var(--accent-primary)" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
