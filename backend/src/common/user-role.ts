export type UserRole = "admin" | "manager" | "nurse" | "caregiver" | "device_manager" | "family" | "user";

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}
