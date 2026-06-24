export type ProductRole =
  | "super_admin"
  | "director"
  | "nurse"
  | "rehab"
  | "family"
  | "visitor"
  | "device_manager";

export interface AccessProfile {
  role: string;
  assignedResidentCodes?: string[];
  boundResidentCodes?: string[];
}

const ROLE_ALIASES: Record<string, ProductRole> = {
  admin: "super_admin",
  manager: "director",
  caregiver: "rehab",
  user: "visitor"
};

const RESIDENT_ADMIN_FIELDS = [
  "name",
  "age",
  "room",
  "careLevel",
  "risk",
  "riskTags",
  "familyContactName",
  "familyContactPhone",
  "careSummary",
  "rehabSummary",
  "status"
];

export function normalizeRole(role: string): ProductRole {
  return ROLE_ALIASES[role] || (role as ProductRole);
}

export function canAccessResident(profile: AccessProfile, residentCode: string): boolean {
  const role = normalizeRole(profile.role);
  if (["super_admin", "director"].includes(role)) return true;
  if (["nurse", "rehab"].includes(role)) {
    return (profile.assignedResidentCodes || []).includes(residentCode);
  }
  if (role === "family") {
    return (profile.boundResidentCodes || []).includes(residentCode);
  }
  return false;
}

export function canReadCareTask(profile: AccessProfile, residentCode: string): boolean {
  const role = normalizeRole(profile.role);
  if (["super_admin", "director"].includes(role)) return true;
  return role === "nurse" && (profile.assignedResidentCodes || []).includes(residentCode);
}

export function canManageCareTask(profile: AccessProfile, residentCode: string): boolean {
  return canReadCareTask(profile, residentCode);
}

export function canReadRehabRecord(profile: AccessProfile, residentCode: string): boolean {
  return canAccessResident(profile, residentCode);
}

export function canManageRehabRecord(profile: AccessProfile, residentCode: string): boolean {
  const role = normalizeRole(profile.role);
  if (["super_admin", "director"].includes(role)) return true;
  return role === "rehab" && (profile.assignedResidentCodes || []).includes(residentCode);
}

export function shouldRedactRehabRecord(roleValue: string): boolean {
  return ["nurse", "family"].includes(normalizeRole(roleValue));
}

export function allowedResidentUpdateFields(roleValue: string): string[] {
  const role = normalizeRole(roleValue);
  if (["super_admin", "director"].includes(role)) return [...RESIDENT_ADMIN_FIELDS];
  if (role === "nurse") return ["careSummary"];
  if (role === "rehab") return ["rehabSummary"];
  return [];
}

export function pickAllowedResidentUpdates<T extends Record<string, unknown>>(
  roleValue: string,
  input: T
): Partial<T> {
  const allowedFields = new Set(allowedResidentUpdateFields(roleValue));
  return Object.fromEntries(Object.entries(input).filter(([key]) => allowedFields.has(key))) as Partial<T>;
}
