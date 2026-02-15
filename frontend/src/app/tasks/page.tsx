"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useTasks } from "../../hooks/useTasks";
import { signOut } from "../../lib/auth";
import { createTask, toggleTask, deleteTask } from "../../lib/api-client";
import type { TaskCreate } from "../../types/task";
import TaskForm from "../../components/TaskForm";
import TaskList from "../../components/TaskList";
import TaskFilters from "../../components/TaskFilters";

export default function TasksPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const { tasks, loading, error, mutate, refetch } = useTasks({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    tag: tagFilter || undefined,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleCreate = useCallback(
    async (data: TaskCreate) => {
      const resp = await createTask(data);
      if (resp.error) {
        alert(resp.error.message);
        return;
      }
      refetch();
    },
    [refetch]
  );

  const handleToggle = useCallback(
    async (id: string) => {
      mutate((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: t.status === "pending" ? "completed" as const : "pending" as const,
              }
            : t
        )
      );
      const resp = await toggleTask(id);
      if (resp.error) {
        refetch();
      }
    },
    [mutate, refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      mutate((prev) => prev.filter((t) => t.id !== id));
      const resp = await deleteTask(id);
      if (resp.error) {
        refetch();
      }
    },
    [mutate, refetch]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/tasks/${id}`);
    },
    [router]
  );

  const clearFilters = useCallback(() => {
    setStatusFilter("");
    setPriorityFilter("");
    setTagFilter("");
  }, []);

  const handleLogout = useCallback(() => {
    signOut();
    router.push("/");
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--accent-primary-light)", borderTopColor: "var(--accent-primary)" }}
          />
          <span style={{ color: "var(--text-muted)" }}>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Top navigation */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b backdrop-blur-sm"
        style={{
          background: "rgba(255,255,255,0.8)",
          borderColor: "var(--border-light)",
        }}
      >
        <Link href="/" className="flex items-center gap-2">
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
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: "var(--accent-primary)" }}
          >
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--text-primary)" }}>
            {user?.name || user?.email || "User"}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border"
            style={{
              borderColor: "var(--border-medium)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header with stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            My Tasks
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {pendingCount} pending
            </span>
            <span
              className="w-1 h-1 rounded-full"
              style={{ background: "var(--text-muted)" }}
            />
            <span className="text-sm" style={{ color: "var(--status-success)" }}>
              {completedCount} completed
            </span>
          </div>
        </div>

        <TaskForm onSubmit={handleCreate} />

        <TaskFilters
          status={statusFilter}
          priority={priorityFilter}
          tag={tagFilter}
          onStatusChange={setStatusFilter}
          onPriorityChange={setPriorityFilter}
          onTagChange={setTagFilter}
          onClear={clearFilters}
        />

        {error && (
          <div
            className="rounded-xl border px-4 py-3 mb-5 text-sm"
            style={{
              background: "var(--status-danger-bg)",
              borderColor: "var(--status-danger)",
              color: "var(--status-danger)",
            }}
          >
            {error}
          </div>
        )}

        <TaskList
          tasks={tasks}
          loading={loading}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>
    </div>
  );
}
