import { RequestUser, UserRole } from "./user-role";

export { USER_ROLES } from "./user-role";

export function canReadAuditLogs(role: UserRole): boolean {
  return role === "super_admin" || role === "director";
}

export function canManageAlerts(role: UserRole): boolean {
  return role === "super_admin" || role === "director" || role === "nurse";
}

export function getResidentScope(
  user: Pick<RequestUser, "role" | "residentCodes">,
): string[] | null {
  if (user.role === "super_admin" || user.role === "director") {
    return null;
  }

  return user.residentCodes;
}
