"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { getTask, updateTask } from "../../../lib/api-client";
import type { Task, TaskUpdate } from "../../../types/task";
import TaskForm from "../../../components/TaskForm";

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    getTask(taskId)
      .then((resp) => {
        if (resp.error) {
          setError(resp.error.message);
        } else if (resp.data) {
          setTask(resp.data);
        }
      })
      .catch(() => setError("Failed to load task"))
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleUpdate = async (data: TaskUpdate) => {
    const resp = await updateTask(taskId, data);
    if (resp.error) {
      alert(resp.error.message);
      return;
    }
    router.push("/tasks");
  };

  if (!authLoading && !isAuthenticated) {
    return null;
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <nav
          className="flex items-center px-6 py-3 border-b"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-light)" }}
        >
          <Link href="/tasks" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "var(--accent-primary)" }}
            >
              T
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Taskflow
            </span>
          </Link>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{ borderColor: "var(--accent-primary-light)", borderTopColor: "var(--accent-primary)" }}
            />
            <span style={{ color: "var(--text-muted)" }}>Loading task...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <nav
          className="flex items-center px-6 py-3 border-b"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-light)" }}
        >
          <Link href="/tasks" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "var(--accent-primary)" }}
            >
              T
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Taskflow
            </span>
          </Link>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div
            className="rounded-xl border p-5"
            style={{
              background: "var(--status-danger-bg)",
              borderColor: "var(--status-danger)",
            }}
          >
            <p className="font-medium mb-2" style={{ color: "var(--status-danger)" }}>{error}</p>
            <Link
              href="/tasks"
              className="text-sm font-medium"
              style={{ color: "var(--accent-primary)" }}
            >
              Back to task list
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <p style={{ color: "var(--text-muted)" }}>Task not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav
        className="flex items-center px-6 py-3 border-b"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-light)" }}
      >
        <Link href="/tasks" className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "var(--accent-primary)" }}
          >
            T
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Taskflow
          </span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm font-medium mb-6"
          style={{ color: "var(--accent-primary)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to tasks
        </Link>

        <TaskForm
          existingTask={task}
          onSubmit={handleUpdate}
          onCancel={() => router.push("/tasks")}
        />
      </main>
    </div>
  );
}
