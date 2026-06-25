(function initApi(global) {
  const TOKEN_KEY = "yian-auth-token";
  const API_BASE = global.APP_API_BASE || (["8080", "5500"].includes(global.location?.port) ? "http://127.0.0.1:3000" : "");

  function getToken() {
    return global.localStorage?.getItem(TOKEN_KEY) || "";
  }

  function setToken(token) {
    if (token) global.localStorage?.setItem(TOKEN_KEY, token);
    else global.localStorage?.removeItem(TOKEN_KEY);
  }

  function userMessageFor(status, serverMessage) {
    const suffix = serverMessage ? `：${serverMessage}` : "";
    const messages = {
      400: `提交内容不符合要求${suffix}`,
      401: "登录状态已失效，请重新登录。",
      403: "当前账号无权执行此操作。",
      404: `请求的数据不存在${suffix}`,
      409: `数据状态发生冲突${suffix}`,
      422: `当前操作不符合业务规则${suffix}`,
      429: "操作过于频繁，请稍后再试。",
      500: "服务器处理失败，请稍后重试。"
    };
    return messages[status] || serverMessage || `请求失败（${status}）`;
  }

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

    let response;
    try {
      response = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
    } catch (error) {
      console.error("API request unavailable", { path, method: options.method || "GET", code: "API_UNAVAILABLE" });
      const unavailable = new Error("无法连接后端服务，请检查后端服务是否启动和网络连接。");
      unavailable.code = "API_UNAVAILABLE";
      unavailable.cause = error;
      throw unavailable;
    }

    if (!response.ok) {
      let serverMessage = "";
      let code = "HTTP_ERROR";
      try {
        const body = await response.json();
        serverMessage = Array.isArray(body.message) ? body.message.join("；") : body.message || "";
        code = body.code || code;
      } catch {
        // Keep the HTTP status message when the body is not JSON.
      }
      if (response.status === 401) setToken("");
      console.error("API request failed", { path, method: options.method || "GET", status: response.status, code });
      const requestError = new Error(userMessageFor(response.status, serverMessage));
      requestError.status = response.status;
      requestError.code = code;
      throw requestError;
    }

    if (response.status === 204) return null;
    const body = await response.json();
    return body?.success === true && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;
  }

  global.YianApi = { API_BASE, TOKEN_KEY, getToken, setToken, request };
})(typeof globalThis !== "undefined" ? globalThis : window);
