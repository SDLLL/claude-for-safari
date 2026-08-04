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
  return wasPresent ? "removed" : "not shown";
})();
