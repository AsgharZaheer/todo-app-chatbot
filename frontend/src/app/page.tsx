"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/tasks");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-light)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--accent-gradient)" }}
          >
            T
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Taskflow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent-gradient)" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-3xl text-center" style={{ animation: "fadeInUp 0.6s ease-out" }}>
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
            style={{ background: "var(--accent-primary-light)", color: "var(--accent-primary)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Full-Stack Todo Application — Phase 2
            Created by [Asghar Zaheer]
          </div>

          <h1
            className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            Manage tasks
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--accent-gradient)" }}
            >
              effortlessly
            </span>
          </h1>

          <p className="text-lg sm:text-xl leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            Create, organize, prioritize, and track your tasks with an intuitive interface. Built with Next.js, FastAPI, and Neon PostgreSQL.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white"
              style={{ background: "var(--accent-gradient)", boxShadow: "0 4px 20px var(--accent-primary-glow)" }}
            >
              Start for Free
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-medium border"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-primary)" }}
            >
              Sign In
            </Link>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: "M12 6v6m0 0v6m0-6h6m-6 0H6", title: "Create & Organize", desc: "Tasks with titles, descriptions, priorities, tags, and due dates" },
              { icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z", title: "Smart Filtering", desc: "Filter by status, priority, or tags to focus on what matters" },
              { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "Track Progress", desc: "Toggle completion, see stats, and monitor your productivity" },
            ].map((f, i) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border text-left"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-light)",
                  boxShadow: "var(--shadow-sm)",
                  animation: `fadeInUp 0.6s ease-out ${0.1 + i * 0.1}s both`,
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "var(--accent-primary-light)" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--accent-primary)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} />
                  </svg>
                </div>
                <h3 className="font-semibold mb-1.5" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-5 text-sm" style={{ color: "var(--text-muted)" }}>
        Hackathon Todo — Phase 2 | Next.js + FastAPI + Neon PostgreSQL
      </footer>
    </div>
  );
}
