(function () {
  var sensitivePattern = /pass(word)?|secret|token|api[_-]?key|auth(orization)?|otp|one.?time|cc.?num|card.?num|cvc|cvv|security.?code/i;
  var sensitiveAutocomplete = /^(current-password|new-password|one-time-code|cc-number|cc-csc|cc-exp|cc-exp-month|cc-exp-year)$/i;
  var unsupportedTypes = /^(hidden|file|password|button|submit|reset|image)$/i;

  function find(root, selector) {
    if (!selector || typeof selector.css !== "string" || !Number.isInteger(selector.index) || selector.index < 0) {
      return { error: "invalid-selector" };
    }
    var matches;
    try {
      matches = root.querySelectorAll(selector.css);
    } catch (_) {
      return { error: "invalid-selector" };
    }
    if (selector.index >= matches.length) return { error: "not-found" };
    if (matches.length > 1 && selector.index === undefined) return { error: "ambiguous" };
    return { element: matches[selector.index] };
  }

  function identityFor(element) {
    return [
      element.type,
      element.id,
      element.name,
      element.getAttribute && element.getAttribute("aria-label"),
      element.getAttribute && element.getAttribute("autocomplete")
    ]
      .filter(Boolean)
      .join(" ");
  }

  function isSensitive(element, type) {
    var autocomplete = (element.getAttribute && element.getAttribute("autocomplete")) || "";
    return type === "password" || type === "file" || sensitiveAutocomplete.test(autocomplete) || sensitivePattern.test(identityFor(element));
  }

  function fire(element, type, Constructor) {
    var EventType = Constructor || Event;
    element.dispatchEvent(new EventType(type, { bubbles: true, cancelable: true }));
  }

  function setNativeProperty(element, property, value) {
    var prototype = Object.getPrototypeOf(element);
    while (prototype) {
      var descriptor = Object.getOwnPropertyDescriptor(prototype, property);
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
        return;
      }
      prototype = Object.getPrototypeOf(prototype);
    }
    element[property] = value;
  }

  function fill(spec, root) {
    root = root || document;
    if (!Array.isArray(spec)) return [{ status: "invalid-spec" }];

    return spec.map(function (item) {
      var result = { selector: item && item.selector };
      try {
        if (!item || typeof item !== "object") return { status: "invalid-item" };
        var found = find(root, item.selector);
        if (!found.element) return { selector: item.selector, status: found.error };
        var element = found.element;
        var tag = element.tagName.toLowerCase();
        var type = tag === "input" ? (element.type || "text").toLowerCase() : tag;

        if (isSensitive(element, type)) return { selector: item.selector, status: "sensitive" };
        if (unsupportedTypes.test(type)) return { selector: item.selector, status: "unsupported" };
        if (element.disabled) return { selector: item.selector, status: "disabled" };
        if (element.readOnly) return { selector: item.selector, status: "readonly" };

        if (type === "checkbox" || type === "radio") {
          setNativeProperty(element, "checked", !!item.value);
          fire(element, "input");
          fire(element, "change");
          return { selector: item.selector, status: "filled", valueAfter: !!element.checked };
        }

        if (tag === "select") {
          var wanted = String(item.value);
          var option = Array.prototype.find.call(element.options || [], function (candidate) {
            return candidate.value === wanted || String(candidate.text).trim().toLowerCase() === wanted.trim().toLowerCase();
          });
          if (!option) return { selector: item.selector, status: "option-not-found" };
          setNativeProperty(element, "value", option.value);
          fire(element, "input");
          fire(element, "change");
          return { selector: item.selector, status: "filled", valueAfter: element.value };
        }

        if (element.hasAttribute && element.hasAttribute("contenteditable")) {
          if (typeof element.focus === "function") element.focus();
          element.textContent = String(item.value);
          fire(element, "input", typeof InputEvent === "function" ? InputEvent : Event);
          return { selector: item.selector, status: "filled", valueAfter: element.textContent };
        }

        if (typeof element.focus === "function") element.focus();
        setNativeProperty(element, "value", String(item.value));
        fire(element, "input");
        fire(element, "change");
        return { selector: item.selector, status: "filled", valueAfter: element.value };
      } catch (error) {
        result.status = "error";
        result.error = error && error.message ? error.message : String(error);
        return result;
      }
    });
  }

  window.__safariAgentFillForms = fill;
  return "installed";
})();
