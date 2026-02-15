/**
 * T021 — Frontend component test for TaskForm.
 * Tests: renders create form, validates title, submits correct data shape.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import userEvent from "@testing-library/user-event";
import TaskForm from "../../src/components/TaskForm";

describe("TaskForm", () => {
  const mockSubmit = jest.fn();
  const mockCancel = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
  });

  it("renders create form with all fields", () => {
    render(<TaskForm onSubmit={mockSubmit} />);

    // Title uses placeholder, not label
    expect(screen.getByPlaceholderText(/task title/i)).toBeInTheDocument();
    // Description uses placeholder
    expect(screen.getByPlaceholderText(/description/i)).toBeInTheDocument();
    // Priority and Recurrence use label elements
    expect(screen.getByText(/priority/i)).toBeInTheDocument();
    expect(screen.getByText(/recurrence/i)).toBeInTheDocument();
    // Tags and Due Date labels
    expect(screen.getByText(/tags/i)).toBeInTheDocument();
    expect(screen.getByText(/due date/i)).toBeInTheDocument();
  });

  it("validates title is required - empty title does not submit", async () => {
    render(<TaskForm onSubmit={mockSubmit} />);

    const submitButton = screen.getByRole("button", { name: /create|save|add/i });
    fireEvent.click(submitButton);

    // Form should not submit without title
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits form with correct data shape", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockSubmit} />);

    const titleInput = screen.getByPlaceholderText(/task title/i);
    await user.type(titleInput, "New task");

    const submitButton = screen.getByRole("button", { name: /create|save|add/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedData = mockSubmit.mock.calls[0][0];
    expect(submittedData).toHaveProperty("title", "New task");
  });

  it("shows cancel button when onCancel provided", () => {
    render(<TaskForm onSubmit={mockSubmit} onCancel={mockCancel} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("pre-fills fields when existingTask is provided", () => {
    const existingTask = {
      id: "test-id",
      title: "Existing task",
      description: "Some description",
      status: "pending" as const,
      priority: "high" as const,
      tags: ["work"],
      due_date: null,
      recurrence: "none" as const,
      user_id: "user-1",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    render(
      <TaskForm
        existingTask={existingTask}
        onSubmit={mockSubmit}
        onCancel={mockCancel}
      />
    );

    const titleInput = screen.getByPlaceholderText(/task title/i) as HTMLInputElement;
    expect(titleInput.value).toBe("Existing task");
  });
});
