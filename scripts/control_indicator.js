(function () {
  var id = "__safari_agent_control_indicator";
  var key = "__safariAgentControlIndicator";
  var stopKey = "__safariAgentStopped";
  var existing = document.getElementById(id);
  if (existing && existing.isConnected !== false) {
    window[key] = existing;
    return "already shown";
  }

  var host = document.body || document.documentElement;
  if (!host) return "document not ready";

  var accent = "#D97757";
  try {
    if (window.sessionStorage && window.sessionStorage.getItem(stopKey) === "1") window[stopKey] = true;
  } catch (_) {}

  var border = document.createElement("div");
  border.id = id;
  border.setAttribute(
    "style",
    "position:fixed;inset:0;border:3px solid " + accent + ";pointer-events:none;" +
      "box-shadow:inset 0 0 28px 6px rgba(217,119,87,.45);" +
      "z-index:2147483647;box-sizing:border-box;"
  );
  try {
    if (typeof border.animate === "function") {
      border.animate(
        [
          { boxShadow: "inset 0 0 22px 4px rgba(217,119,87,.30)" },
          { boxShadow: "inset 0 0 44px 12px rgba(217,119,87,.60)" }
        ],
        { duration: 1300, direction: "alternate", iterations: Infinity, easing: "ease-in-out" }
      );
    }
  } catch (_) {}

  var badge = document.createElement("div");
  badge.setAttribute(
    "style",
    "position:fixed;top:0;left:50%;transform:translateX(-50%);" +
      "background:" + accent + ";color:#fff;font:12px/1.6 -apple-system,sans-serif;" +
      "padding:1px 6px 1px 12px;border-radius:0 0 8px 8px;pointer-events:none;" +
      "z-index:2147483647;white-space:nowrap;"
  );
  var label = document.createElement("span");
  label.textContent = "AI agent is controlling this tab";
  var stop = document.createElement("button");
  stop.textContent = "Stop";
  stop.setAttribute(
    "style",
    "pointer-events:auto;cursor:pointer;margin-left:8px;border:0;border-radius:6px;" +
      "padding:0 8px;font:600 11px/1.6 -apple-system,sans-serif;background:#fff;color:#1f1e1d;"
  );

  function markStopped() {
    label.textContent = "Agent stopped by user";
    stop.setAttribute("style", "display:none;");
    border.setAttribute(
      "style",
      "position:fixed;inset:0;border:3px solid #8a8a8a;pointer-events:none;" +
        "z-index:2147483647;box-sizing:border-box;"
    );
    badge.setAttribute(
      "style",
      "position:fixed;top:0;left:50%;transform:translateX(-50%);" +
        "background:#8a8a8a;color:#fff;font:12px/1.6 -apple-system,sans-serif;" +
        "padding:1px 12px;border-radius:0 0 8px 8px;pointer-events:none;" +
        "z-index:2147483647;white-space:nowrap;"
    );
  }

  if (typeof stop.addEventListener === "function") {
    stop.addEventListener("click", function (event) {
      try { event.preventDefault(); event.stopPropagation(); } catch (_) {}
      window[stopKey] = true;
      try { window.sessionStorage.setItem(stopKey, "1"); } catch (_) {}
      markStopped();
    }, true);
  }

  badge.appendChild(label);
  badge.appendChild(stop);
  border.appendChild(badge);
  host.appendChild(border);
  window[key] = border;
  if (window[stopKey]) markStopped();
  return "shown";
})();
