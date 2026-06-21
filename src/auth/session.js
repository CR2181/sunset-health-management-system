(function initAuthSession(global) {
  const SESSION_KEY = "yian-auth-session";

  function sanitizeUser(user) {
    if (!user?.email || !user?.role) return null;
    return {
      id: user.id,
      email: String(user.email).trim().toLowerCase(),
      role: user.role,
      displayName: user.displayName || user.email,
      residentCodes: Array.isArray(user.residentCodes) ? [...user.residentCodes] : [],
    };
  }

  function createAuthSessionManager(options = {}) {
    const storage = options.storage || global.localStorage;

    function save(user, token) {
      const safeUser = sanitizeUser(user);
      if (!safeUser || !token) {
        throw new Error("A valid backend user and token are required.");
      }
      storage.setItem(SESSION_KEY, JSON.stringify({ user: safeUser, token: String(token) }));
    }

    function restore() {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || "null");
        const user = sanitizeUser(value?.user);
        if (!user || !value?.token) {
          storage.removeItem(SESSION_KEY);
          return null;
        }
        return { user, token: String(value.token) };
      } catch {
        storage.removeItem(SESSION_KEY);
        return null;
      }
    }

    function logout() {
      storage.removeItem(SESSION_KEY);
    }

    return { save, restore, logout, sessionKey: SESSION_KEY };
  }

  global.YianAuthSession = { SESSION_KEY, createAuthSessionManager, sanitizeUser };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianAuthSession;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
