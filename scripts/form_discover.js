(function () {
  var sensitivePattern = /pass(word)?|secret|token|api[_-]?key|auth(orization)?|otp|one.?time|cc.?num|card.?num|cvc|cvv|security.?code/i;
  var sensitiveAutocomplete = /^(current-password|new-password|one-time-code|cc-number|cc-csc|cc-exp|cc-exp-month|cc-exp-year)$/i;
  var unsupportedTypes = /^(button|submit|reset|image)$/i;

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, function (char) {
      return "\\" + char.codePointAt(0).toString(16) + " ";
    });
  }

  function attrEscape(value) {
    return String(value)
      .replace(/\0/g, "�")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/[\n\r\f]/g, function (char) {
        return "\\" + char.codePointAt(0).toString(16) + " ";
      });
  }

  function selectorFor(root, element) {
    var css;
    if (element.id) {
      css = "#" + cssEscape(element.id);
    } else {
      var tag = element.tagName.toLowerCase();
      if (element.name) css = tag + '[name="' + attrEscape(element.name) + '"]';
      else css = tag;
    }
    var matches = root.querySelectorAll(css);
    if (matches.length === 1) return { css: css, index: 0 };
    for (var i = 0; i < matches.length; i++) {
      if (matches[i] === element) return { css: css, index: i };
    }
    return { css: css, index: -1 };
  }

  function labelFor(root, element) {
    if (element.id && root.querySelector) {
      var explicit = root.querySelector('label[for="' + attrEscape(element.id) + '"]');
      if (explicit) return explicit.textContent.trim();
    }
    if (typeof element.closest === "function") {
      var wrapped = element.closest("label");
      if (wrapped) return wrapped.textContent.trim();
    }
    var aria = element.getAttribute && element.getAttribute("aria-label");
    if (aria) return aria.trim();
    var refs = element.getAttribute && element.getAttribute("aria-labelledby");
    if (refs && root.getElementById) {
      return refs
        .split(/\s+/)
        .map(function (id) {
          var node = root.getElementById(id);
          return node ? node.textContent.trim() : "";
        })
        .filter(Boolean)
        .join(" ");
    }
    return element.placeholder || "";
  }

  function isVisible(element) {
    var rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    var style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function isSensitive(element, type, label) {
    var autocomplete = (element.getAttribute && element.getAttribute("autocomplete")) || "";
    var identity = [element.id, element.name, label, autocomplete].filter(Boolean).join(" ");
    return type === "password" || type === "file" || sensitiveAutocomplete.test(autocomplete) || sensitivePattern.test(identity);
  }

  function discover(root) {
    root = root || document;
    var fields = [];
    var elements = root.querySelectorAll('input, textarea, select, [contenteditable="true"]');
    Array.prototype.forEach.call(elements, function (element) {
      var tag = element.tagName.toLowerCase();
      var type = tag === "input" ? (element.type || "text").toLowerCase() : tag;
      if (type === "hidden" || !isVisible(element)) return;

      var label = labelFor(root, element).substring(0, 120);
      var sensitive = isSensitive(element, type, label);
      var supported = !sensitive && !unsupportedTypes.test(type);
      var field = {
        index: fields.length,
        selector: selectorFor(root, element),
        tag: tag,
        type: element.hasAttribute && element.hasAttribute("contenteditable") ? "contenteditable" : type,
        label: label,
        placeholder: element.placeholder || undefined,
        required: element.required || undefined,
        readonly: element.readOnly || undefined,
        disabled: element.disabled || undefined,
        sensitive: sensitive || undefined,
        supported: supported
      };

      if (supported) {
        if (type === "checkbox" || type === "radio") {
          field.value = element.value;
          field.checked = !!element.checked;
        } else if (tag === "select") {
          field.value = element.value;
          field.options = Array.prototype.map.call(element.options || [], function (option) {
            return { value: option.value, text: option.text, selected: option.selected || undefined };
          });
        } else if (field.type === "contenteditable") {
          field.value = String(element.textContent || "").substring(0, 200);
        } else {
          field.value = element.value;
        }
      }
      fields.push(field);
    });
    return fields;
  }

  window.__safariAgentDiscoverForms = discover;
  return JSON.stringify(discover(document));
})();
