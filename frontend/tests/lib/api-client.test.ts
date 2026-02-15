/**
 * T057 — Frontend API client tests.
 * Tests: JWT header attachment, response envelope parsing, error handling.
 */

import {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  toggleTask,
} from "../../src/lib/api-client";

// Mock auth module
jest.mock("../../src/lib/auth", () => ({
  getToken: jest.fn(),
}));

import { getToken } from "../../src/lib/auth";

const mockedGetToken = getToken as jest.MockedFunction<typeof getToken>;

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetToken.mockResolvedValue("test-jwt-token");
  });

  describe("JWT header attachment", () => {
    it("attaches Bearer token from auth session", async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: [], error: null, meta: { total: 0 } }),
      });

      await listTasks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-jwt-token",
          }),
        })
      );
    });

    it("omits Authorization header when no token", async () => {
      mockedGetToken.mockResolvedValue(null);
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: [], error: null, meta: { total: 0 } }),
      });

      await listTasks();

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders.Authorization).toBeUndefined();
    });
  });

  describe("response envelope parsing", () => {
    it("returns full envelope for successful responses", async () => {
      const envelope = {
        data: { id: "1", title: "Test", status: "pending" },
        error: null,
        meta: null,
      };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(envelope),
      });

      const result = await getTask("1");

      expect(result).toEqual(envelope);
      expect(result.data).toHaveProperty("title", "Test");
      expect(result.error).toBeNull();
    });

    it("returns error envelope for error responses", async () => {
      const envelope = {
        data: null,
        error: { code: "NOT_FOUND", message: "Task not found", details: [] },
        meta: null,
      };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(envelope),
      });

      const result = await getTask("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toHaveProperty("code", "NOT_FOUND");
    });
  });

  describe("endpoint methods", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ data: null, error: null, meta: null }),
      });
    });

    it("createTask sends POST to /api/tasks", async () => {
      await createTask({ title: "New task" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "New task" }),
        })
      );
    });

    it("listTasks sends GET to /api/tasks", async () => {
      await listTasks();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks"),
        expect.objectContaining({
          headers: expect.any(Object),
        })
      );
    });

    it("listTasks appends filter query params", async () => {
      await listTasks({ status: "pending", priority: "high" });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain("status=pending");
      expect(url).toContain("priority=high");
    });

    it("updateTask sends PATCH to /api/tasks/{id}", async () => {
      await updateTask("task-1", { title: "Updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks/task-1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ title: "Updated" }),
        })
      );
    });

    it("deleteTask sends DELETE to /api/tasks/{id}", async () => {
      await deleteTask("task-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks/task-1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("toggleTask sends PATCH to /api/tasks/{id}/toggle", async () => {
      await toggleTask("task-1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tasks/task-1/toggle"),
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });
});
