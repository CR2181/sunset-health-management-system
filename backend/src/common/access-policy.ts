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

export function allowedResidentUpdateFields(roleValue: string): string[] {
  const role = normalizeRole(roleValue);
  if (["super_admin", "director"].includes(role)) return [...RESIDENT_ADMIN_FIELDS];
  if (role === "nurse") return ["careSummary"];
  if (role === "rehab") return ["rehabSummary"];
  return [];
}
