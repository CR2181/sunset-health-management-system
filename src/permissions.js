(function initPermissions(global) {
  function roleOf(user) {
    return user?.role || "visitor";
  }

  function isAdmin(user) {
    return ["admin", "super_admin"].includes(roleOf(user));
  }

  function canViewCameraLedger(user) {
    return ["admin", "super_admin", "manager", "director", "nurse", "device_manager"].includes(roleOf(user));
  }

  function canViewRtsp(user) {
    return isAdmin(user);
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
    canViewCameraLedger,
    canViewRtsp,
    canReviewAiEvent,
    canViewAuditLogs
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
