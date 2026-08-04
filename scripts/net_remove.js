(function () {
  var key = "__safariAgentNetState";
  var state = window[key];
  if (!state || !state.installed) return "not installed";
  if (state.originals.fetch) window.fetch = state.originals.fetch;
  XMLHttpRequest.prototype.open = state.originals.open;
  XMLHttpRequest.prototype.send = state.originals.send;
  state.log.splice(0, state.log.length);
  state.installed = false;
  try {
    delete window[key];
    delete window.__safariAgentNetOptions;
    delete window.__safariAgentNetQuery;
  } catch (_) {
    window[key] = undefined;
  }
  return "removed";
})();
