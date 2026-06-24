(function registerAlertsPage(global) {
  const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const statusLabels = { new: "待确认", acknowledged: "已确认", resolved: "已解决", false_positive: "误报" };
  global.YianPages.register("alerts", ({ data }) => `
    <div class="page-heading"><div><span class="badge danger">安全中心</span><h2>告警中心</h2><p>AI 风险提示与设备告警均需人工确认；AI 输出不构成医疗诊断。</p></div><button class="ghost-button" data-ui-action="refresh-current" type="button"><i data-lucide="refresh-cw"></i><span>刷新</span></button></div>
    <div class="alert-center-list">${(data.alerts || []).map((item) => {
      const active = ["new", "acknowledged"].includes(item.status || "new");
      const source = item.sourceType === "ai_vision" ? `AI视觉 · ${item.sourceId || "未知来源"}` : "系统设备/人工事件";
      const confidence = Number.isFinite(Number(item.confidence)) ? `${Math.round(Number(item.confidence) * 100)}%` : "不适用";
      return `<article class="alert-detail-row ${escape(item.level)}">
        <div class="alert-detail-main"><div class="entity-card-head"><strong>${escape(item.title)}</strong><span class="badge ${item.level === "high" || item.level === "critical" ? "danger" : "warning"}">${escape(statusLabels[item.status] || item.status || item.state)}</span></div>
          <p>${escape(item.meta)}</p>
          <dl><dt>来源</dt><dd>${escape(source)}</dd><dt>位置</dt><dd>${escape(item.location || "未记录")}</dd><dt>置信度</dt><dd>${escape(confidence)}</dd><dt>最近检测</dt><dd>${escape(item.lastDetectedAt || item.createdAt || "暂无")}</dd><dt>重复次数</dt><dd>${escape(item.occurrenceCount || 1)}</dd></dl>
          <div class="ai-summary-note"><strong>AI辅助摘要</strong><span>${escape(item.llmSummary || "未启用摘要服务，请结合现场情况人工复核。")}</span></div>
        </div>
        ${active ? `<div class="row-actions"><button class="primary-action" data-pilot-action="alert-ack" data-id="${escape(item.id)}" type="button">确认</button><button class="ghost-button" data-pilot-action="alert-resolve" data-id="${escape(item.id)}" type="button">解决</button><button class="ghost-button danger" data-pilot-action="alert-false-positive" data-id="${escape(item.id)}" type="button">误报</button></div>` : '<span class="secondary-copy">处置已完成</span>'}
      </article>`;
    }).join("") || '<div class="empty-state">暂无告警</div>'}</div>
  `);
})(typeof globalThis !== "undefined" ? globalThis : window);
