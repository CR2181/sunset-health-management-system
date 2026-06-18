(function initAuthSession(global) {
  const SESSION_KEY = "yian-rbac-session";

  function sanitizeUser(account) {
    if (!account) return null;
    return {
      email: account.email,
      role: account.role,
      roleName: account.roleName,
      displayName: account.displayName,
      assignedResidentCodes: account.assignedResidentCodes || [],
      boundResidentCodes: account.boundResidentCodes || []
    };
  }

  function createAuthSessionManager(options = {}) {
    const storage = options.storage || global.localStorage;
    const accounts = options.accounts || global.YianMockAccounts?.demoAccounts || [];

    function findAccount(email) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      return accounts.find((account) => account.email.toLowerCase() === normalizedEmail);
    }

    function login(email, password) {
      const account = findAccount(email);
      if (!account || account.password !== password) {
        return {
          ok: false,
          code: "AUTH_INVALID_CREDENTIALS",
          message: "账号或密码不正确"
        };
      }

      const user = sanitizeUser(account);
      storage.setItem(SESSION_KEY, JSON.stringify(user));
      return {
        ok: true,
        code: "OK",
        user
      };
    }

    function restore() {
      try {
        const raw = storage.getItem(SESSION_KEY);
        if (!raw) return null;
        const user = JSON.parse(raw);
        const account = findAccount(user?.email);
        if (!account) {
          storage.removeItem(SESSION_KEY);
          return null;
        }
        const restoredUser = sanitizeUser(account);
        storage.setItem(SESSION_KEY, JSON.stringify(restoredUser));
        return restoredUser;
      } catch (error) {
        storage.removeItem(SESSION_KEY);
        return null;
      }
    }

    function logout() {
      storage.removeItem(SESSION_KEY);
    }

    return {
      login,
      restore,
      logout,
      sessionKey: SESSION_KEY
    };
  }

  global.YianAuthSession = {
    SESSION_KEY,
    createAuthSessionManager,
    sanitizeUser
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianAuthSession;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
