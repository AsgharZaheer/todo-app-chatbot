"use client";

import { useState } from "react";
import type { Task, TaskCreate, TaskUpdate, TaskPriority, TaskRecurrence } from "../types/task";
import { validateTaskForm, type ValidationError } from "../lib/validators";

interface TaskFormProps {
  existingTask?: Task;
  onSubmit: (data: TaskCreate & TaskUpdate) => Promise<void>;
  onCancel?: () => void;
}

export default function TaskForm({
  existingTask,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const isEditMode = !!existingTask;
  const [expanded, setExpanded] = useState(isEditMode);

  const [title, setTitle] = useState(existingTask?.title ?? "");
  const [description, setDescription] = useState(existingTask?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(existingTask?.priority ?? "medium");
  const [tags, setTags] = useState(existingTask?.tags.join(", ") ?? "");
  const [dueDate, setDueDate] = useState(
    existingTask?.due_date
      ? new Date(existingTask.due_date).toISOString().slice(0, 16)
      : ""
  );
  const [recurrence, setRecurrence] = useState<TaskRecurrence>(existingTask?.recurrence ?? "none");
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const getFieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      recurrence,
      due_date: dueDate || null,
    };

    const validationErrors = validateTaskForm(formData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);

    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        priority,
        tags: parsedTags,
        due_date: formData.due_date
          ? new Date(formData.due_date).toISOString()
          : null,
        recurrence,
      });

      if (!isEditMode) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setTags("");
        setDueDate("");
        setRecurrence("none");
        setExpanded(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Compact "add task" bar when collapsed
  if (!isEditMode && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 border-dashed text-left cursor-pointer mb-6"
        style={{
          borderColor: "var(--input-border)",
          background: "var(--bg-secondary)",
          color: "var(--text-muted)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-primary-light)" }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--accent-primary)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span className="text-sm font-medium">Add a new task...</span>
      </button>
    );
  }

  const inputClass = (field?: string) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm outline-none ${
      getFieldError(field ?? "")
        ? "border-red-400"
        : ""
    }`;

  const inputStyle = (field?: string) => ({
    background: "var(--bg-secondary)",
    borderColor: getFieldError(field ?? "") ? "var(--status-danger)" : "var(--input-border)",
    color: "var(--text-primary)",
  });

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-5 mb-6"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-light)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          {isEditMode ? "Edit Task" : "New Task"}
        </h2>
        {!isEditMode && (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="p-1 rounded-md"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <div className="mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          className={inputClass("title")}
          style={inputStyle("title")}
          maxLength={200}
          autoFocus
        />
        {getFieldError("title") && (
          <p className="text-xs mt-1.5" style={{ color: "var(--status-danger)" }}>
            {getFieldError("title")}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="mb-3">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a description (optional)"
          className={inputClass()}
          style={{ ...inputStyle(), resize: "none" as const }}
          rows={2}
          maxLength={1000}
        />
      </div>

      {/* Priority + Recurrence */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className={inputClass()}
            style={inputStyle()}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Recurrence
          </label>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as TaskRecurrence)}
            className={inputClass("recurrence")}
            style={inputStyle("recurrence")}
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          {getFieldError("recurrence") && (
            <p className="text-xs mt-1.5" style={{ color: "var(--status-danger)" }}>
              {getFieldError("recurrence")}
            </p>
          )}
        </div>
      </div>

      {/* Tags + Due Date */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="work, personal"
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Due Date
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass()}
            style={inputStyle()}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
          style={{
            background: "var(--accent-primary)",
            boxShadow: "0 2px 8px 0 rgba(99, 102, 241, 0.3)",
          }}
        >
          {submitting
            ? "Saving..."
            : isEditMode
            ? "Update Task"
            : "Add Task"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border"
            style={{
              borderColor: "var(--border-light)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
