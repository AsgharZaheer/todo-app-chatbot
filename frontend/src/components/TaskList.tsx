"use client";

import type { Task } from "../types/task";
import TaskCard from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  loading?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function TaskList({
  tasks,
  loading,
  onToggle,
  onDelete,
  onEdit,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border p-4 animate-pulse"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-light)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-5 h-5 rounded-full mt-0.5"
                style={{ background: "var(--bg-tertiary)" }}
              />
              <div className="flex-1">
                <div
                  className="h-4 rounded-md w-3/4 mb-2.5"
                  style={{ background: "var(--bg-tertiary)" }}
                />
                <div
                  className="h-3 rounded-md w-1/2"
                  style={{ background: "var(--bg-tertiary)" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "var(--accent-primary-light)" }}
        >
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: "var(--accent-primary)" }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-base font-medium mb-1" style={{ color: "var(--text-primary)" }}>
          No tasks yet
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Click &ldquo;Add a new task&rdquo; above to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
