(function () {
  var state = window.__safariAgentNetState;
  if (!state || !state.installed) return "network observer not installed";
  var query = window.__safariAgentNetQuery || {};
  var entries = state.log.slice();
  if (query.match) {
    entries = entries.filter(function (entry) {
      return entry.url && entry.url.indexOf(String(query.match)) !== -1;
    });
  }
  var limit = Number.isInteger(query.limit) && query.limit > 0 ? Math.min(query.limit, 100) : 50;
  return JSON.stringify({
    pending: state.pending,
    bodyCapture: state.captureBodies,
    matched: entries.length,
    entries: entries.slice(-limit)
  });
})();
