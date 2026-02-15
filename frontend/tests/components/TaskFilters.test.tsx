/**
 * T051 — Frontend component test for TaskFilters.
 * Tests: renders filter controls, filter change triggers callback, clear resets state.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/jest-globals";
import TaskFilters from "../../src/components/TaskFilters";

describe("TaskFilters", () => {
  const mockStatusChange = jest.fn();
  const mockPriorityChange = jest.fn();
  const mockTagChange = jest.fn();
  const mockClear = jest.fn();

  const defaultProps = {
    status: "",
    priority: "",
    tag: "",
    onStatusChange: mockStatusChange,
    onPriorityChange: mockPriorityChange,
    onTagChange: mockTagChange,
    onClear: mockClear,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders status, priority, and tag filter controls", () => {
    render(<TaskFilters {...defaultProps} />);

    // Status dropdown
    const statusSelect = screen.getByDisplayValue("All Status");
    expect(statusSelect).toBeInTheDocument();

    // Priority dropdown
    const prioritySelect = screen.getByDisplayValue("All Priority");
    expect(prioritySelect).toBeInTheDocument();

    // Tag input
    const tagInput = screen.getByPlaceholderText(/filter by tag/i);
    expect(tagInput).toBeInTheDocument();
  });

  it("triggers status change callback", () => {
    render(<TaskFilters {...defaultProps} />);

    const statusSelect = screen.getByDisplayValue("All Status");
    fireEvent.change(statusSelect, { target: { value: "pending" } });

    expect(mockStatusChange).toHaveBeenCalledWith("pending");
  });

  it("triggers priority change callback", () => {
    render(<TaskFilters {...defaultProps} />);

    const prioritySelect = screen.getByDisplayValue("All Priority");
    fireEvent.change(prioritySelect, { target: { value: "high" } });

    expect(mockPriorityChange).toHaveBeenCalledWith("high");
  });

  it("triggers tag change callback", () => {
    render(<TaskFilters {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText(/filter by tag/i);
    fireEvent.change(tagInput, { target: { value: "work" } });

    expect(mockTagChange).toHaveBeenCalledWith("work");
  });

  it("shows clear button when filters are active", () => {
    render(<TaskFilters {...defaultProps} status="pending" />);

    const clearButton = screen.getByText(/clear filters/i);
    expect(clearButton).toBeInTheDocument();
  });

  it("hides clear button when no filters active", () => {
    render(<TaskFilters {...defaultProps} />);

    expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
  });

  it("triggers clear callback when clear button clicked", () => {
    render(<TaskFilters {...defaultProps} status="completed" />);

    const clearButton = screen.getByText(/clear filters/i);
    fireEvent.click(clearButton);

    expect(mockClear).toHaveBeenCalledTimes(1);
  });
});
