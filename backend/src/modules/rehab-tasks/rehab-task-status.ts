export const REHAB_TASK_STATUSES = ["pending", "in_progress", "completed", "skipped", "exception"] as const;

export function canTransitionRehabTask(current: string, next: string): boolean {
  const transitions: Record<string, string[]> = {
    pending: ["in_progress", "skipped", "exception"],
    in_progress: ["completed", "skipped", "exception"],
    completed: [],
    skipped: [],
    exception: []
  };
  return (transitions[current] || []).includes(next);
}
