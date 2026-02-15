/** TypeScript interfaces for Task CRUD — mirrors backend schemas. */

export type TaskStatus = "pending" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskRecurrence = "none" | "daily" | "weekly" | "monthly";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  due_date: string | null;
  recurrence: TaskRecurrence;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  tags?: string[];
  due_date?: string | null;
  recurrence?: TaskRecurrence;
}

export interface TaskUpdate {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  tags?: string[];
  due_date?: string | null;
  recurrence?: TaskRecurrence;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: ErrorDetail[];
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta: Record<string, unknown> | null;
}

export interface TaskListResponse extends ApiResponse<Task[]> {
  meta: { total: number } | null;
}
