(function initPermissions(global) {
  function roleOf(user) {
    return user?.role || "visitor";
  }

  function isAdmin(user) {
    return ["admin", "super_admin"].includes(roleOf(user));
  }

  function canCreateResident(user) {
    return ["admin", "super_admin", "manager", "director"].includes(roleOf(user));
  }

  function canEditResident(user) {
    return ["admin", "super_admin", "manager", "director", "nurse", "caregiver", "rehab"].includes(roleOf(user));
  }

  function residentEditableFields(user) {
    const role = roleOf(user);
    if (["admin", "super_admin", "manager", "director"].includes(role)) {
      return ["name", "age", "room", "careLevel", "risk", "riskTags", "familyContactName", "familyContactPhone", "careSummary", "rehabSummary", "status"];
    }
    if (role === "nurse") return ["careSummary"];
    if (["caregiver", "rehab"].includes(role)) return ["rehabSummary"];
    return [];
  }

  function canManageCareTasks(user) {
    return ["admin", "super_admin", "manager", "director", "nurse"].includes(roleOf(user));
  }

  function canManageRehab(user) {
    return ["admin", "super_admin", "manager", "director", "caregiver", "rehab"].includes(roleOf(user));
  }

  function canViewCameraLedger(user) {
    return ["admin", "super_admin", "manager", "director", "nurse", "device_manager"].includes(roleOf(user));
  }

  function canViewRtsp(user) {
    return isAdmin(user);
  }

  function canManageCameraConfig(user) {
    return isAdmin(user) || roleOf(user) === "device_manager";
  }

  function canReviewAiEvent(user) {
    return ["admin", "super_admin", "manager", "director", "nurse"].includes(roleOf(user));
  }

  function canViewAuditLogs(user) {
    return ["admin", "super_admin", "manager", "director"].includes(roleOf(user));
  }

  function isFamily(user) {
    return roleOf(user) === "family";
  }

  global.YianPermissions = {
    roleOf,
    isAdmin,
    isFamily,
    canCreateResident,
    canEditResident,
    residentEditableFields,
    canManageCareTasks,
    canManageRehab,
    canViewCameraLedger,
    canViewRtsp,
    canManageCameraConfig,
    canReviewAiEvent,
    canViewAuditLogs
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
