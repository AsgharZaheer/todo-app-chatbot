"use client";

import type { Task } from "../types/task";

interface TaskCardProps {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "var(--status-danger-bg)", text: "var(--status-danger)", label: "High" },
  medium: { bg: "var(--status-warning-bg)", text: "var(--status-warning)", label: "Medium" },
  low: { bg: "var(--status-success-bg)", text: "var(--status-success)", label: "Low" },
};

export default function TaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const prio = priorityConfig[task.priority] ?? priorityConfig.medium;

  return (
    <div
      className="group rounded-xl border p-4 mb-3 flex items-start gap-4"
      style={{
        background: "var(--bg-secondary)",
        borderColor: isCompleted ? "var(--border-light)" : "var(--border-light)",
        boxShadow: "var(--shadow-sm)",
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Toggle checkbox */}
      <button
        onClick={() => onToggle?.(task.id)}
        className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: isCompleted ? "var(--status-success)" : "var(--input-border)",
          background: isCompleted ? "var(--status-success)" : "transparent",
        }}
        aria-label={isCompleted ? "Mark as pending" : "Mark as completed"}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="font-medium text-sm"
          style={{
            color: isCompleted ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: isCompleted ? "line-through" : "none",
          }}
        >
          {task.title}
        </h3>

        {task.description && (
          <p
            className="text-xs mt-1 line-clamp-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {/* Priority badge */}
          <span
            className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{ background: prio.bg, color: prio.text }}
          >
            {prio.label}
          </span>

          {/* Tags */}
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: "var(--accent-primary-light)",
                color: "var(--accent-primary)",
              }}
            >
              {tag}
            </span>
          ))}

          {/* Due date */}
          {task.due_date && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}

          {/* Recurrence */}
          {task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--status-info)" }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {task.recurrence}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0">
        {onEdit && (
          <button
            onClick={() => onEdit(task.id)}
            className="p-2 rounded-lg"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Edit task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (confirm("Delete this task permanently?")) {
                onDelete(task.id);
              }
            }}
            className="p-2 rounded-lg"
            style={{ color: "var(--status-danger)" }}
            aria-label="Delete task"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
