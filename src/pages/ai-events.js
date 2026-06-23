(function registerAiEventsPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const labels = { fall: "跌倒", leaving_bed: "离床", wandering: "徘徊", boundary_crossing: "越界", stillness: "长时静止" };
  const statuses = { pending: "待复核", pending_review: "待复核", confirmed: "已确认", false_positive: "误报", resolved: "已关闭" };
  global.YianPages.register("aiEvents", ({ data, user }) => {
    const events = data.aiEvents?.length ? data.aiEvents : global.YianDemoData.aiEvents;
    const canReview = global.YianPermissions.canReviewAiEvent(user);
    return `
      <div class="page-heading"><div><span class="badge warning">Demo Only</span><h2>AI事件复核</h2><p>只处理本地演示视频或截图路径，不执行真实模型推理。</p></div><button class="ghost-button" data-ui-action="ai-import-info" type="button"><i data-lucide="file-video"></i><span>导入说明</span></button></div>
      <div class="dataset-note"><strong>推荐测试数据集</strong><span>UR Fall Detection Dataset：跌倒检测演示</span><span>NTU RGB+D：动作识别/跌倒动作演示</span><small>数据文件只保存在本地，不提交到 Git；其他数据集由 docs 后续补充。</small></div>
      <div class="ai-event-list">${events.map((event) => `
        <article class="ai-review-card"><div class="evidence-placeholder"><i data-lucide="scan-eye"></i><span>${escape(event.evidenceUrl || "无证据文件")}</span></div><div class="ai-review-content"><div class="entity-card-head"><strong>${labels[event.eventType] || escape(event.eventType)}</strong><span class="badge info">${Math.round(Number(event.confidence || 0) * 100)}%</span></div><p>${escape(event.location)} · ${escape(event.cameraCode || event.cameraId)} · ${escape(event.residentCode || event.residentId || "未关联老人")}</p><span>检测时间：${escape(event.detectedAt || event.eventTime || event.createdAt || "暂无")}</span><span>状态：${statuses[event.status] || escape(event.status)}</span><span>复核人：${escape(event.reviewer || event.reviewedBy || "未复核")}</span>${canReview && ["pending", "pending_review"].includes(event.status) ? `<div class="row-actions"><button class="primary-action" data-ai-review="confirmed" data-id="${escape(event.id)}" type="button">确认有效</button><button class="ghost-button" data-ai-review="false_positive" data-id="${escape(event.id)}" type="button">标记误报</button><button class="ghost-button" data-ai-review="alert" data-id="${escape(event.id)}" type="button">转为告警</button><button class="icon-button" data-ai-review="resolved" data-id="${escape(event.id)}" title="关闭事件" type="button"><i data-lucide="x"></i></button></div>` : ""}</div></article>`).join("")}</div>
    `;
  });
})(typeof globalThis !== "undefined" ? globalThis : window);
