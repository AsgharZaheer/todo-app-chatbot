"use client";

import { useCallback, useEffect, useState } from "react";
import { listTasks } from "../lib/api-client";
import type { Task } from "../types/task";

interface UseTasksOptions {
  status?: string;
  priority?: string;
  tag?: string;
}

/** SWR-style data fetching hook for tasks. */
export function useTasks(options?: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listTasks(options);
      if (resp.error) {
        setError(resp.error.message);
      } else {
        setTasks(resp.data ?? []);
        setTotal(resp.meta?.total ?? 0);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [options?.status, options?.priority, options?.tag]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /** Mutate the local task list (optimistic update). */
  const mutate = useCallback(
    (updater: (tasks: Task[]) => Task[]) => {
      setTasks(updater);
    },
    []
  );

  return { tasks, total, loading, error, mutate, refetch: fetchTasks };
}
