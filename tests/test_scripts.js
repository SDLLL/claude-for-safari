const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function source(name) {
  return fs.readFileSync(path.join(root, "scripts", name), "utf8");
}

class MockEvent {
  constructor(type, options) {
    this.type = type;
    Object.assign(this, options || {});
  }
}

class MockElement {
  constructor(tagName, options = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = options.id || "";
    this.name = options.name || "";
    this.type = options.type || (tagName === "input" ? "text" : "");
    this.placeholder = options.placeholder || "";
    this.required = !!options.required;
    this.readOnly = !!options.readOnly;
    this.disabled = !!options.disabled;
    this.options = options.options || [];
    this.textContent = options.textContent || "";
    this.attributes = Object.assign({}, options.attributes);
    this.events = [];
    this.children = [];
    this.isConnected = true;
    this._value = options.value || "";
    this._checked = !!options.checked;
  }
  get value() { return this._value; }
  set value(value) { this._value = String(value); }
  get checked() { return this._checked; }
  set checked(value) { this._checked = !!value; }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getBoundingClientRect() { return { width: 120, height: 24 }; }
  closest() { return null; }
  focus() { this.focused = true; }
  dispatchEvent(event) { this.events.push(event.type); return true; }
  appendChild(child) { this.children.push(child); child.parent = this; }
  remove() { this.isConnected = false; if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this); }
}

function makeFormRoot(elements) {
  const byId = new Map(elements.filter((element) => element.id).map((element) => [element.id, element]));
  return {
    getElementById(id) { return byId.get(id) || null; },
    querySelector(selector) {
      if (selector.startsWith('label[for="')) return null;
      const matches = this.querySelectorAll(selector);
      return matches[0] || null;
    },
    querySelectorAll(selector) {
      if (selector === 'input, textarea, select, [contenteditable="true"]') return elements;
      if (selector.startsWith("#")) return elements.filter((element) => "#" + element.id === selector);
      const nameMatch = selector.match(/^([a-z]+)\[name="(.*)"\]$/i);
      if (nameMatch) return elements.filter((element) => element.tagName.toLowerCase() === nameMatch[1].toLowerCase() && element.name === nameMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
      return elements.filter((element) => element.tagName.toLowerCase() === selector.toLowerCase());
    }
  };
}

function makeContext(overrides = {}) {
  const context = {
    console,
    URL,
    TextDecoder,
    Event: MockEvent,
    InputEvent: MockEvent,
    MouseEvent: MockEvent,
    CSS: { escape: (value) => String(value).replace(/([^a-zA-Z0-9_-])/g, "\\$1") },
    getComputedStyle: () => ({ display: "block", visibility: "visible" }),
    performance: { getEntriesByType: () => [] },
    location: { origin: "https://example.com", href: "https://example.com/page" },
    ...overrides
  };
  context.window = context;
  return vm.createContext(context);
}

test("control indicator is idempotent and removable", () => {
  const elements = new Map();
  const body = new MockElement("body");
  body.appendChild = (element) => { elements.set(element.id, element); element.parent = body; body.children.push(element); };
  const document = {
    body,
    documentElement: body,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => elements.get(id) || null
  };
  const context = makeContext({ document });
  assert.equal(vm.runInContext(source("control_indicator.js"), context), "shown");
  assert.equal(vm.runInContext(source("control_indicator.js"), context), "already shown");
  assert.equal(vm.runInContext(source("control_indicator_remove.js"), context), "removed");
  assert.equal(vm.runInContext(source("control_indicator_remove.js"), context), "not shown");
});

test("form discovery never returns sensitive values", () => {
  const safe = new MockElement("input", { id: "full-name", name: "full-name", value: "Ada" });
  const password = new MockElement("input", { id: "password", type: "password", value: "hidden" });
  const apiKey = new MockElement("input", { id: "api-key", name: "api_key", value: "hidden" });
  const file = new MockElement("input", { id: "upload", type: "file", value: "hidden" });
  const submit = new MockElement("input", { id: "submit", type: "submit", value: "Send" });
  const quotedName = new MockElement("input", { name: 'display"name', value: "safe" });
  const document = makeFormRoot([safe, password, apiKey, file, submit, quotedName]);
  const context = makeContext({ document });
  const discovered = JSON.parse(vm.runInContext(source("form_discover.js"), context));
  assert.equal(discovered[0].value, "Ada");
  for (const field of discovered.slice(1)) {
    if (field.type === "submit") {
      assert.equal(field.supported, false);
      assert.equal(Object.prototype.hasOwnProperty.call(field, "value"), false);
    } else if (field.selector.css.includes("display")) {
      assert.equal(field.supported, true);
      assert.match(field.selector.css, /\\"/);
    } else {
      assert.equal(field.sensitive, true);
      assert.equal(field.supported, false);
      assert.equal(Object.prototype.hasOwnProperty.call(field, "value"), false);
    }
  }
});

test("form filling handles supported fields and isolates errors", () => {
  const text = new MockElement("input", { id: "name" });
  const checkbox = new MockElement("input", { id: "updates", type: "checkbox" });
  const select = new MockElement("select", { id: "country", options: [{ value: "tw", text: "Taiwan" }, { value: "us", text: "United States" }] });
  const readonly = new MockElement("input", { id: "readonly", readOnly: true, value: "keep" });
  const password = new MockElement("input", { id: "password", type: "password" });
  const file = new MockElement("input", { id: "upload", type: "file" });
  const duplicateA = new MockElement("input", { name: "dup" });
  const duplicateB = new MockElement("input", { name: "dup" });
  const document = makeFormRoot([text, checkbox, select, readonly, password, file, duplicateA, duplicateB]);
  const context = makeContext({ document });
  assert.equal(vm.runInContext(source("form_fill.js"), context), "installed");

  const result = context.__safariAgentFillForms([
    { selector: { css: "#name", index: 0 }, value: "O'Connor $(safe)" },
    { selector: { css: "#updates", index: 0 }, value: true },
    { selector: { css: "#country", index: 0 }, value: "United States" },
    { selector: { css: "#readonly", index: 0 }, value: "replace" },
    { selector: { css: "#password", index: 0 }, value: "no" },
    { selector: { css: "#upload", index: 0 }, value: "no" },
    { selector: { css: 'input[name="dup"]', index: 1 }, value: "second" },
    { selector: { css: "#missing", index: 0 }, value: "no" }
  ], document);

  assert.equal(result[0].status, "filled");
  assert.equal(text.value, "O'Connor $(safe)");
  assert.equal(result[1].valueAfter, true);
  assert.equal(result[2].valueAfter, "us");
  assert.equal(result[3].status, "readonly");
  assert.equal(result[4].status, "sensitive");
  assert.equal(result[5].status, "sensitive");
  assert.equal(duplicateB.value, "second");
  assert.equal(result[7].status, "not-found");
});

class MockXHR {
  constructor() {
    this.listeners = {};
    this.status = 200;
    this.responseType = "";
    this.responseText = "ok";
  }
  open(method, url) { this.originalOpen = { method, url }; }
  send(body) { this.originalBody = body; }
  addEventListener(type, listener, options) {
    this.listeners[type] ||= [];
    this.listeners[type].push({ listener, once: !!(options && options.once) });
  }
  emit(type) {
    const listeners = (this.listeners[type] || []).slice();
    this.listeners[type] = (this.listeners[type] || []).filter((entry) => !entry.once);
    for (const entry of listeners) entry.listener.call(this);
  }
}

function response(body = "ok", url = "https://example.com/api") {
  return {
    status: 200,
    url,
    headers: { get: () => "application/json" },
    clone() {
      let sent = false;
      return {
        body: {
          getReader() {
            return {
              read: async () => sent ? { done: true } : (sent = true, { done: false, value: new TextEncoder().encode(body) }),
              cancel: async () => {}
            };
          }
        }
      };
    }
  };
}

test("network observer defaults to metadata, redacts URLs, and handles XHR reuse", async () => {
  const originalFetch = async () => response();
  const context = makeContext({ XMLHttpRequest: MockXHR, fetch: originalFetch, TextEncoder });
  assert.equal(vm.runInContext(source("net_monitor.js"), context), "installed (metadata only)");

  await context.fetch("https://example.com/api?token=secret&ok=1");
  const xhr = new context.XMLHttpRequest();
  xhr.open("GET", "https://example.com/xhr?session=secret");
  xhr.send();
  xhr.emit("loadend");
  xhr.open("GET", "https://example.com/xhr?session=secret2");
  xhr.send();
  xhr.emit("loadend");

  assert.equal(context.__safariAgentNetState.pending, 0);
  assert.equal(context.__safariAgentNetState.log.length, 3);
  assert.equal(context.__safariAgentNetState.log.some((entry) => entry.url.includes("secret")), false);
  const read = JSON.parse(vm.runInContext(source("net_read.js"), context));
  assert.equal(read.bodyCapture, false);
  assert.equal(read.entries.some((entry) => "requestBody" in entry || "responseBody" in entry), false);
  context.__safariAgentNetOptions = { captureBodies: true, bodyOrigin: "https://example.com" };
  assert.match(vm.runInContext(source("net_monitor.js"), context), /remove it before reinstalling/);
  assert.equal(vm.runInContext(source("net_remove.js"), context), "removed");
  assert.equal(context.fetch, originalFetch);
  assert.equal(vm.runInContext(source("net_remove.js"), context), "not installed");
});

test("network body capture requires matching origin and redacts snippets", async () => {
  let responseUrl = "https://example.com/api";
  const context = makeContext({
    XMLHttpRequest: MockXHR,
    fetch: async () => response('{"token":"secret","value":"ok"}', responseUrl),
    TextEncoder,
    __safariAgentNetOptions: { captureBodies: true, bodyOrigin: "https://example.com" }
  });
  assert.equal(vm.runInContext(source("net_monitor.js"), context), "installed (body capture enabled)");
  await context.fetch("https://example.com/api", { method: "POST", body: "password=secret&value=ok" });
  await new Promise((resolve) => setImmediate(resolve));
  const entry = context.__safariAgentNetState.log[0];
  assert.equal(entry.requestBody.includes("secret"), false);
  assert.equal(entry.responseBody.includes("secret"), false);
  assert.ok(entry.requestBody.length <= 2048);
  assert.ok(entry.responseBody.length <= 2048);

  responseUrl = "https://third-party.example/result";
  await context.fetch("https://third-party.example/api", { method: "POST", body: "password=secret" });
  await new Promise((resolve) => setImmediate(resolve));
  const crossOrigin = context.__safariAgentNetState.log[1];
  assert.equal("requestBody" in crossOrigin, false);
  assert.equal("responseBody" in crossOrigin, false);
});

test("JXA form runner uses JSON serialization and no eval", () => {
  const runner = source("form_fill_runner.jxa");
  assert.match(runner, /FORM_SPEC_JSON/);
  assert.match(runner, /FORM_SPEC_PATH/);
  assert.match(runner, /JSON\.stringify\(spec\)/);
  assert.doesNotMatch(runner, /\beval\s*\(/);
});

test("fixture includes sensitive and supported controls", () => {
  const fixture = fs.readFileSync(path.join(root, "tests", "fixtures", "forms.html"), "utf8");
  assert.match(fixture, /type="password"/);
  assert.match(fixture, /type="file"/);
  assert.match(fixture, /contenteditable="true"/);
  assert.match(fixture, /name="api_key"/);
});
