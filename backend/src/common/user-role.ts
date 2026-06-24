export type UserRole =
  | "admin"
  | "manager"
  | "nurse"
  | "caregiver"
  | "device_manager"
  | "family"
  | "user"
  | "super_admin"
  | "director"
  | "rehab"
  | "visitor";

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}
