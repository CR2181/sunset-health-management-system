export const REHAB_PLAN_STATUSES = ["draft", "active", "paused", "archived"] as const;

export function canTransitionRehabPlan(current: string, next: string): boolean {
  const transitions: Record<string, string[]> = {
    draft: ["active", "archived"],
    active: ["paused", "archived"],
    paused: ["active", "archived"],
    archived: []
  };
  return (transitions[current] || []).includes(next);
}
