"use client";

interface TaskFiltersProps {
  status: string;
  priority: string;
  tag: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onTagChange: (tag: string) => void;
  onClear: () => void;
}

export default function TaskFilters({
  status,
  priority,
  tag,
  onStatusChange,
  onPriorityChange,
  onTagChange,
  onClear,
}: TaskFiltersProps) {
  const hasFilters = status || priority || tag;

  const selectStyle = {
    background: "var(--bg-secondary)",
    borderColor: "var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="flex flex-wrap items-center gap-3 mb-5 px-4 py-3 rounded-xl border"
      style={{
        background: "var(--bg-tertiary)",
        borderColor: "var(--border-light)",
      }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Filters
      </span>

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm"
        style={selectStyle}
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={priority}
        onChange={(e) => onPriorityChange(e.target.value)}
        className="border rounded-lg px-3 py-1.5 text-sm"
        style={selectStyle}
      >
        <option value="">All Priority</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <input
        type="text"
        value={tag}
        onChange={(e) => onTagChange(e.target.value)}
        placeholder="Search by tag..."
        className="border rounded-lg px-3 py-1.5 text-sm w-40"
        style={selectStyle}
      />

      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{
            color: "var(--accent-primary)",
            background: "var(--accent-primary-light)",
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
}
