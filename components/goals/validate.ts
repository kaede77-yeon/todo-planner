export interface GoalFormValues {
  title: string;
  description: string;
}

/** Returns an error message, or null when valid. */
export function validateGoalForm(values: GoalFormValues): string | null {
  if (values.title.trim() === "") return "제목을 입력해주세요.";
  return null;
}
