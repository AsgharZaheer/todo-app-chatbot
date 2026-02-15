/**
 * Client-side validation — mirrors backend Task Intelligence Skill rules.
 * Provides instant UX feedback; backend re-validates authoritatively.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTitle(title: string): ValidationError | null {
  if (!title || title.trim().length === 0) {
    return { field: "title", message: "Title is required" };
  }
  if (title.length > 200) {
    return {
      field: "title",
      message: "Title must be 200 characters or less",
    };
  }
  return null;
}

export function validateDescription(
  description: string | null | undefined
): ValidationError | null {
  if (description && description.length > 1000) {
    return {
      field: "description",
      message: "Description must be 1000 characters or less",
    };
  }
  return null;
}

export function validatePriority(
  priority: string
): ValidationError | null {
  const valid = ["low", "medium", "high"];
  if (!valid.includes(priority)) {
    return {
      field: "priority",
      message: "Priority must be low, medium, or high",
    };
  }
  return null;
}

export function validateRecurrence(
  recurrence: string,
  dueDate: string | null | undefined
): ValidationError | null {
  const valid = ["none", "daily", "weekly", "monthly"];
  if (!valid.includes(recurrence)) {
    return {
      field: "recurrence",
      message: "Recurrence must be none, daily, weekly, or monthly",
    };
  }
  if (recurrence !== "none" && !dueDate) {
    return {
      field: "recurrence",
      message: "Recurrence requires a due date",
    };
  }
  return null;
}

export function validateTaskForm(data: {
  title: string;
  description?: string | null;
  priority: string;
  recurrence: string;
  due_date?: string | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  const titleError = validateTitle(data.title);
  if (titleError) errors.push(titleError);

  const descError = validateDescription(data.description);
  if (descError) errors.push(descError);

  const priorityError = validatePriority(data.priority);
  if (priorityError) errors.push(priorityError);

  const recurrenceError = validateRecurrence(
    data.recurrence,
    data.due_date
  );
  if (recurrenceError) errors.push(recurrenceError);

  return errors;
}
