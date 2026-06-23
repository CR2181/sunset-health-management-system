(function registerCamerasPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const maskStream = (stream) => stream ? stream.replace(/:\/\/[^@/]+@/, "://***:***@") : "未配置";

  global.YianPages.register("cameras", ({ data, user }) => {
    if (!global.YianPermissions.canViewCameraLedger(user) || global.YianPermissions.isFamily(user)) return global.YianNoPermissionPage.render({ title: "无权查看摄像头" });
    const canViewRtsp = global.YianPermissions.canViewRtsp(user);
    const cameras = data.cameras?.length ? data.cameras : global.YianDemoData.cameras;
    return `
      <div class="page-heading"><div><span class="badge info">合法自有设备</span><h2>摄像头管理</h2><p>当前只保存 RTSP/ONVIF/NVR 配置和状态，不播放真实视频、不做真实 AI 推理。</p></div>${canViewRtsp ? '<button class="primary-action" data-ui-action="camera-create" type="button"><i data-lucide="plus"></i><span>新增摄像头</span></button>' : ''}</div>
      <div class="camera-security-note"><i data-lucide="shield-check"></i><span>原始 RTSP 地址仅管理员可见；普通角色只看到脱敏地址和预览占位。</span></div>
      <div class="camera-ledger">${cameras.map((camera) => `
        <article class="camera-config-card">
          <div class="camera-placeholder"><i data-lucide="camera"></i><span>${camera.maskedDisplay === false ? "配置预览" : "脱敏预览占位"}</span></div>
          <div class="camera-config-body"><div class="entity-card-head"><strong>${escape(camera.name)}</strong><span class="status-dot ${escape(camera.status)}">${escape(camera.status)}</span></div>
            <dl><dt>楼层/区域</dt><dd>${escape(camera.floor || "未设置")} / ${escape(camera.area || camera.location || "未设置")}</dd><dt>用途</dt><dd>${escape(camera.purpose || camera.behavior || "公共区域")}</dd><dt>接入类型</dt><dd>${escape(camera.accessType || "RTSP")}</dd><dt>AI分析</dt><dd>${camera.aiEnabled === false ? "未启用" : "已启用（仅预留）"}</dd><dt>脱敏显示</dt><dd>${camera.maskedDisplay === false ? "否" : "是"}</dd><dt>最近心跳</dt><dd>${escape(camera.lastHeartbeatAt || "暂无")}</dd><dt>接入地址</dt><dd class="mono-value">${escape(canViewRtsp ? camera.stream : maskStream(camera.stream))}</dd></dl>
            <p>${escape(camera.note || "合法自有设备配置预留")}</p><div class="row-actions"><button class="ghost-button" data-ui-action="camera-detail" data-id="${escape(camera.id)}" type="button">查看配置</button>${canViewRtsp ? `<button class="ghost-button" data-ui-action="camera-edit" data-id="${escape(camera.id)}" type="button">编辑</button>` : ""}</div>
          </div>
        </article>`).join("")}</div>
      ${canViewRtsp ? `<form class="camera-form hidden" id="cameraConfigForm"><h3>摄像头配置预留</h3><div class="form-grid"><label>摄像头名称<input name="name" required /></label><label>所属楼层<input name="floor" required /></label><label>所属区域<input name="area" required /></label><label>摄像头用途<select name="purpose"><option>公共走廊</option><option>活动区</option><option>出入口</option><option>护理站</option><option>康复区</option><option>餐厅</option></select></label><label>接入类型<select name="accessType"><option>RTSP</option><option>ONVIF</option><option>NVR</option><option>Demo Video</option></select></label><label class="wide-field">RTSP / 本地演示地址<input name="stream" placeholder="rtsp://username:password@192.168.1.100:554/stream1" /></label><label class="check-field"><input type="checkbox" name="aiEnabled" />启用 AI 分析</label><label class="check-field"><input type="checkbox" name="maskedDisplay" checked />脱敏显示</label><label>在线状态<select name="status"><option>offline</option><option>online</option><option>demo</option></select></label><label class="wide-field">备注<textarea name="note"></textarea></label></div><div class="row-actions"><button class="primary-action" type="submit">保存配置</button><button class="ghost-button" data-ui-action="camera-form-close" type="button">取消</button></div></form>` : ""}
    `;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
