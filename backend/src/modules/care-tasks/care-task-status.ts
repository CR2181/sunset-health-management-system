export const CARE_TASK_STATUSES = ["pending", "in_progress", "completed", "overdue", "exception"] as const;

export type CareTaskStatus = typeof CARE_TASK_STATUSES[number];

const TRANSITIONS: Record<CareTaskStatus, CareTaskStatus[]> = {
  pending: ["in_progress", "exception"],
  in_progress: ["completed", "exception"],
  overdue: ["in_progress", "completed", "exception"],
  completed: [],
  exception: []
};

export function assertCareTaskTransition(current: string, next: string): void {
  const allowed = TRANSITIONS[current as CareTaskStatus] || [];
  if (!allowed.includes(next as CareTaskStatus)) {
    throw new Error(`Care task cannot transition from ${current} to ${next}.`);
  }
}

export function toCareTaskDisplayState(status: string): string {
  const states: Record<string, string> = {
    pending: "待处理",
    in_progress: "进行中",
    completed: "已完成",
    overdue: "已超时",
    exception: "异常关闭"
  };
  return states[status] || "待处理";
}

export function toCareTaskTone(status: string): string {
  const tones: Record<string, string> = {
    pending: "doing",
    in_progress: "doing",
    completed: "done",
    overdue: "late",
    exception: "late"
  };
  return tones[status] || "doing";
}
