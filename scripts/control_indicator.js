(function () {
  var id = "__safari_agent_control_indicator";
  var key = "__safariAgentControlIndicator";
  var existing = document.getElementById(id);
  if (existing && existing.isConnected !== false) {
    window[key] = existing;
    return "already shown";
  }

  var host = document.body || document.documentElement;
  if (!host) return "document not ready";

  var border = document.createElement("div");
  border.id = id;
  border.setAttribute(
    "style",
    "position:fixed;inset:0;border:3px solid #D97757;pointer-events:none;" +
      "z-index:2147483647;box-sizing:border-box;"
  );

  var badge = document.createElement("div");
  badge.textContent = "AI agent is controlling this tab";
  badge.setAttribute(
    "style",
    "position:fixed;top:0;left:50%;transform:translateX(-50%);" +
      "background:#D97757;color:#fff;font:12px/1.6 -apple-system,sans-serif;" +
      "padding:1px 12px;border-radius:0 0 8px 8px;pointer-events:none;" +
      "z-index:2147483647;"
  );
  border.appendChild(badge);
  host.appendChild(border);
  window[key] = border;
  return "shown";
})();
