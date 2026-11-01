(function () {
  var id = "__safari_agent_control_indicator";
  var key = "__safariAgentControlIndicator";
  var element = window[key] || document.getElementById(id);
  var wasPresent = !!(element && element.isConnected !== false);
  if (wasPresent && typeof element.remove === "function") element.remove();
  try {
    delete window[key];
  } catch (_) {
    window[key] = undefined;
  }
  // Task is over: forget the cursor and any Stop request so a later task starts clean.
  try { delete window.__safariAgentCursorElement; } catch (_) { window.__safariAgentCursorElement = undefined; }
  try { delete window.__safariAgentCursor; } catch (_) { window.__safariAgentCursor = undefined; }
  try { delete window.__safariAgentStopped; } catch (_) { window.__safariAgentStopped = undefined; }
  try { window.sessionStorage.removeItem("__safariAgentStopped"); } catch (_) {}
  return wasPresent ? "removed" : "not shown";
})();
