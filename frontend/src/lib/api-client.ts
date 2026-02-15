/**
 * Typed API client for backend Task CRUD endpoints.
 * Attaches JWT from auth session as Bearer token.
 * Handles { data, error, meta } response envelope.
 */

import { getToken } from "./auth";
import type {
  ApiResponse,
  Task,
  TaskCreate,
  TaskListResponse,
  TaskUpdate,
} from "../types/task";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return resp.json();
}

/** POST /api/tasks — Create a task */
export async function createTask(
  data: TaskCreate
): Promise<ApiResponse<Task>> {
  return fetchApi<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /api/tasks — List user's tasks (with optional filters) */
export async function listTasks(params?: {
  status?: string;
  priority?: string;
  tag?: string;
}): Promise<TaskListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.tag) searchParams.set("tag", params.tag);

  const query = searchParams.toString();
  const path = query ? `/api/tasks?${query}` : "/api/tasks";
  return fetchApi<Task[]>(path) as Promise<TaskListResponse>;
}

/** GET /api/tasks/{id} — Get a single task */
export async function getTask(id: string): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/tasks/${id}`);
}

/** PATCH /api/tasks/{id} — Update task fields */
export async function updateTask(
  id: string,
  data: TaskUpdate
): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE /api/tasks/{id} — Delete a task */
export async function deleteTask(
  id: string
): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
  return fetchApi<{ id: string; deleted: boolean }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

/** PATCH /api/tasks/{id}/toggle — Toggle task completion */
export async function toggleTask(
  id: string
): Promise<ApiResponse<Task>> {
  return fetchApi<Task>(`/api/tasks/${id}/toggle`, {
    method: "PATCH",
  });
}
