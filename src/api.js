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

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";

    let response;
    try {
      response = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
    } catch (error) {
      const unavailable = new Error("后端服务暂不可用，当前显示演示数据。");
      unavailable.code = "API_UNAVAILABLE";
      unavailable.cause = error;
      throw unavailable;
    }

    if (!response.ok) {
      let message = `请求失败（${response.status}）`;
      try {
        const body = await response.json();
        message = Array.isArray(body.message) ? body.message.join("；") : body.message || message;
      } catch {
        // Keep the HTTP status message when the body is not JSON.
      }
      const requestError = new Error(message);
      requestError.status = response.status;
      throw requestError;
    }

    if (response.status === 204) return null;
    const body = await response.json();
    return body?.success === true && Object.prototype.hasOwnProperty.call(body, "data") ? body.data : body;
  }

  global.YianApi = { API_BASE, TOKEN_KEY, getToken, setToken, request };
})(typeof globalThis !== "undefined" ? globalThis : window);
