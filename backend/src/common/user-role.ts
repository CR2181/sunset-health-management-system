export const USER_ROLES = [
  "super_admin",
  "director",
  "nurse",
  "rehab",
  "family",
  "visitor",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  residentCodes: string[];
}
