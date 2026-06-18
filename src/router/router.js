(function initRouter(global) {
  const PUBLIC_VIEWS = new Set(["login"]);
  const FALLBACK_VIEWS = new Set(["no-permission", "not-found"]);

  function normalizeHash(hash) {
    return String(hash || "").replace(/^#\/?/, "").trim() || "login";
  }

  function createAppRouter(options) {
    const getUser = options.getUser;
    const canAccessRoute = options.canAccessRoute;
    const getLandingView = options.getLandingView;
    const showView = options.showView;
    const showLogin = options.showLogin;

    function navigate(view, replace = false) {
      const nextHash = `#/${view}`;
      if (replace) {
        global.location.replace(nextHash);
        return;
      }
      global.location.hash = nextHash;
    }

    function goHome() {
      const user = getUser();
      navigate(user ? getLandingView(user) : "login");
    }

    function resolve() {
      const view = normalizeHash(global.location.hash);
      const resolvedView = global.YianRBAC?.resolveRouteKey(view) || view;
      const user = getUser();

      if (resolvedView !== view) {
        navigate(resolvedView, true);
        return;
      }

      if (PUBLIC_VIEWS.has(view)) {
        if (user) {
          navigate(getLandingView(user), true);
          return;
        }
        showLogin();
        return;
      }

      if (!user) {
        navigate("login", true);
        return;
      }

      if (FALLBACK_VIEWS.has(view)) {
        showView(view);
        return;
      }

      if (!global.YianRBAC.getRouteByKey(view)) {
        showView("not-found");
        return;
      }

      if (!canAccessRoute(user, view)) {
        showView("no-permission");
        return;
      }

      showView(view);
    }

    return {
      navigate,
      goHome,
      normalizeHash,
      resolve,
      start() {
        global.addEventListener("hashchange", resolve);
        resolve();
      }
    };
  }

  global.YianRouter = {
    createAppRouter,
    normalizeHash
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = global.YianRouter;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
