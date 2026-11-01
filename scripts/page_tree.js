(function () {
  // Lists the interactive elements of the page with stable refs ("ref_N"), or searches them.
  // Set window.__safariAgentTree = { query, viewportOnly, max } first. Returns a JSON string.
  // Refs live in window.__safariAgentRefs.byId and are reused for the same element across reads.
  var options = window.__safariAgentTree || {};
  var max = Math.max(1, Math.min(Number(options.max) || 200, 1000));
  var words = String(options.query || "").toLowerCase().split(/\s+/).filter(Boolean);
  var registry = window.__safariAgentRefs;
  if (!registry) {
    registry = window.__safariAgentRefs = { next: 1, byId: Object.create(null), ids: new WeakMap() };
  }

  var INTERACTIVE_ROLES = /^(button|link|textbox|searchbox|combobox|checkbox|radio|switch|tab|menuitem|option|slider|spinbutton)$/;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|META|LINK|TITLE)$/;

  function clean(text, limit) {
    var value = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
    return value.length > limit ? value.slice(0, limit - 1) + "…" : value;
  }

  function roleOf(el) {
    var explicit = el.getAttribute("role");
    if (explicit) return explicit.split(/\s+/)[0];
    var tag = el.tagName.toLowerCase();
    if (tag === "a") return el.hasAttribute("href") ? "link" : "";
    if (tag === "button" || tag === "summary") return "button";
    if (tag === "select") return "combobox";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
      var type = String(el.type || "text").toLowerCase();
      if (type === "hidden") return "";
      if (type === "checkbox" || type === "radio") return type;
      if (/^(button|submit|reset|image)$/.test(type)) return "button";
      if (type === "range") return "slider";
      if (type === "search") return "searchbox";
      return "textbox";
    }
    var editable = el.getAttribute("contenteditable");
    if (editable === "" || editable === "true") return "textbox";
    return "";
  }

  function isInteractive(el, role) {
    if (role && INTERACTIVE_ROLES.test(role)) return true;
    if (el.hasAttribute("onclick")) return true;
    return el.hasAttribute("tabindex") && Number(el.tabIndex) >= 0;
  }

  function isVisible(el) {
    try {
      var style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
    } catch (_) { return false; }
    return !!(el.getClientRects && el.getClientRects().length);
  }

  function inViewport(el) {
    var rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  function nameOf(el, role) {
    var label = el.getAttribute("aria-label");
    if (label && label.trim()) return clean(label, 100);
    var labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      var text = labelledBy.split(/\s+/).map(function (id) {
        var node = document.getElementById(id);
        return node ? node.textContent : "";
      }).join(" ");
      if (clean(text, 100)) return clean(text, 100);
    }
    var tag = el.tagName.toLowerCase();
    if (el.labels && el.labels.length) {
      var labelText = Array.prototype.map.call(el.labels, function (item) { return item.textContent; }).join(" ");
      if (clean(labelText, 100)) return clean(labelText, 100);
    }
    if (tag === "input" && /^(button|submit|reset)$/.test(String(el.type).toLowerCase())) return clean(el.value, 100);
    if (tag === "input" || tag === "textarea" || tag === "select") {
      return clean(el.getAttribute("placeholder") || el.getAttribute("title") || el.name || el.id, 100);
    }
    if (tag === "img") return clean(el.getAttribute("alt"), 100);
    return clean(el.innerText != null ? el.innerText : el.textContent, 100) || clean(el.getAttribute("title"), 100);
  }

  function refFor(el) {
    var id = registry.ids.get(el);
    if (!id) {
      id = "ref_" + registry.next++;
      registry.ids.set(el, id);
    }
    registry.byId[id] = el;
    return id;
  }

  function describe(el, role) {
    var tag = el.tagName.toLowerCase();
    var item = { ref: refFor(el), role: role || "clickable", name: nameOf(el, role) };
    if (tag === "input") {
      var type = String(el.type || "text").toLowerCase();
      item.type = type;
      // Never expose values of password, file or secret-looking fields.
      var secret = type === "password" || type === "file" || /passw|token|secret|api.?key|cvv|cvc|card.?n|otp/i.test((el.name || "") + " " + (el.id || ""));
      if (type === "checkbox" || type === "radio") item.checked = !!el.checked;
      else if (!secret && el.value) item.value = clean(el.value, 80);
      if (secret) item.sensitive = true;
    } else if (tag === "textarea" && el.value) {
      item.value = clean(el.value, 80);
    } else if (tag === "a" && el.getAttribute("href")) {
      item.href = clean(el.href || el.getAttribute("href"), 120);
    }
    if (el.disabled) item.disabled = true;
    item.inViewport = inViewport(el);
    return item;
  }

  var items = [];
  var truncated = false;

  function walk(node) {
    if (items.length >= max) { truncated = true; return; }
    if (node.nodeType !== 1 || SKIP.test(node.tagName) || node.id === "__safari_agent_control_indicator") return;
    if (!isVisible(node)) return;
    var role = roleOf(node);
    if (isInteractive(node, role) && (!options.viewportOnly || inViewport(node))) {
      var item = describe(node, role);
      var haystack = (item.role + " " + item.name + " " + (item.value || "") + " " + (node.id || "")).toLowerCase();
      if (words.every(function (word) { return haystack.indexOf(word) >= 0; })) items.push(item);
    }
    if (node.shadowRoot) {
      for (var s = 0; s < node.shadowRoot.children.length; s++) walk(node.shadowRoot.children[s]);
    }
    for (var i = 0; i < node.children.length; i++) walk(node.children[i]);
  }

  walk(document.body || document.documentElement);
  return JSON.stringify({ count: items.length, truncated: truncated, items: items });
})();
