(function () {
  var stateKey = "__safariAgentNetState";
  var secretKeyPattern = /^(token|access_token|refresh_token|auth|authorization|code|key|api_key|password|passwd|secret|session|sid|cookie|jwt)$/i;
  var options = window.__safariAgentNetOptions || {};
  var captureBodies = options.captureBodies === true && options.bodyOrigin === location.origin;
  if (window[stateKey] && window[stateKey].installed) {
    return window[stateKey].captureBodies === captureBodies
      ? "already installed"
      : "already installed with a different body-capture mode; remove it before reinstalling";
  }
  var maxEntries = 100;
  var maxBodyChars = 2048;

  function redactText(value) {
    if (typeof value !== "string") return value;
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]")
      .replace(/(["']?(?:token|access_token|refresh_token|auth|authorization|code|key|api_key|password|passwd|secret|session|sid|cookie|jwt)["']?\s*[:=]\s*)["']?[^&\s,"'}]+/gi, "$1[REDACTED]");
  }

  function redactUrl(value) {
    try {
      var url = new URL(String(value), location.href);
      Array.from(url.searchParams.keys()).forEach(function (key) {
        if (secretKeyPattern.test(key)) url.searchParams.set(key, "[REDACTED]");
      });
      return url.href;
    } catch (_) {
      return redactText(String(value));
    }
  }

  function bodySnippet(value) {
    if (!captureBodies || typeof value !== "string") return undefined;
    return redactText(value.slice(0, maxBodyChars));
  }

  function isBodyOrigin(value) {
    if (!captureBodies) return false;
    try {
      return new URL(String(value), location.href).origin === options.bodyOrigin;
    } catch (_) {
      return false;
    }
  }

  var originalFetch = window.fetch;
  var originalOpen = XMLHttpRequest.prototype.open;
  var originalSend = XMLHttpRequest.prototype.send;
  var state = {
    installed: true,
    captureBodies: captureBodies,
    bodyOrigin: captureBodies ? options.bodyOrigin : null,
    log: [],
    pending: 0,
    originals: { fetch: originalFetch, open: originalOpen, send: originalSend }
  };
  window[stateKey] = state;

  function push(entry) {
    state.log.push(entry);
    if (state.log.length > maxEntries) state.log.splice(0, state.log.length - maxEntries);
  }

  function readFetchBody(response, entry, requestUrl) {
    var effectiveUrl = response && response.url ? response.url : requestUrl;
    if (!isBodyOrigin(effectiveUrl)) return;
    var contentType = response.headers && response.headers.get ? response.headers.get("content-type") || "" : "";
    if (!/(json|text|xml|javascript|x-www-form-urlencoded)/i.test(contentType)) return;
    try {
      var clone = response.clone();
      if (!clone.body || !clone.body.getReader || typeof TextDecoder !== "function") return;
      var reader = clone.body.getReader();
      var decoder = new TextDecoder();
      var text = "";
      function readNext() {
        return reader.read().then(function (chunk) {
          if (chunk.done || text.length >= maxBodyChars) {
            if (reader.cancel) {
              var cancellation = reader.cancel();
              if (cancellation && cancellation.catch) cancellation.catch(function () {});
            }
            entry.responseBody = redactText(text.slice(0, maxBodyChars));
            return;
          }
          text += decoder.decode(chunk.value, { stream: true });
          return readNext();
        });
      }
      readNext().catch(function () {});
    } catch (_) {}
  }

  if (typeof originalFetch === "function") {
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : input && input.url ? input.url : String(input);
      var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
      var entry = { source: "fetch", method: method, url: redactUrl(url), startedAt: Date.now() };
      var requestBody = init && init.body;
      var snippet = isBodyOrigin(url) ? bodySnippet(requestBody) : undefined;
      if (snippet !== undefined) entry.requestBody = snippet;
      state.pending += 1;
      push(entry);
      var promise;
      try {
        promise = originalFetch.apply(this, arguments);
      } catch (error) {
        state.pending -= 1;
        entry.error = String(error);
        throw error;
      }
      return Promise.resolve(promise).then(
        function (response) {
          state.pending -= 1;
          entry.status = response.status;
          entry.contentType = response.headers && response.headers.get ? response.headers.get("content-type") || "" : "";
          entry.durationMs = Date.now() - entry.startedAt;
          readFetchBody(response, entry, url);
          return response;
        },
        function (error) {
          state.pending -= 1;
          entry.error = String(error);
          entry.durationMs = Date.now() - entry.startedAt;
          throw error;
        }
      );
    };
  }

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__safariAgentRequest = { method: String(method).toUpperCase(), url: redactUrl(url) };
    return originalOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var request = this.__safariAgentRequest || { method: "GET", url: "(unknown)" };
    var entry = { source: "xhr", method: request.method, url: request.url, startedAt: Date.now() };
    var snippet = isBodyOrigin(request.url) ? bodySnippet(body) : undefined;
    if (snippet !== undefined) entry.requestBody = snippet;
    var settled = false;
    state.pending += 1;
    push(entry);
    this.addEventListener(
      "loadend",
      function () {
        if (settled) return;
        settled = true;
        state.pending -= 1;
        entry.status = this.status;
        entry.durationMs = Date.now() - entry.startedAt;
        var effectiveUrl = this.responseURL || request.url;
        if (isBodyOrigin(effectiveUrl) && (this.responseType === "" || this.responseType === "text")) {
          try {
            entry.responseBody = redactText(String(this.responseText || "").slice(0, maxBodyChars));
          } catch (_) {}
        }
      },
      { once: true }
    );
    try {
      return originalSend.apply(this, arguments);
    } catch (error) {
      if (!settled) {
        settled = true;
        state.pending -= 1;
      }
      entry.error = String(error);
      throw error;
    }
  };

  try {
    performance.getEntriesByType("resource").forEach(function (resource) {
      push({ source: "performance", type: resource.initiatorType, url: redactUrl(resource.name), durationMs: Math.round(resource.duration) });
    });
  } catch (_) {}

  return captureBodies ? "installed (body capture enabled)" : "installed (metadata only)";
})();
