const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "scripts", "page_tree.js"), "utf8");

class El {
  constructor(tag, props = {}, children = []) {
    this.nodeType = 1;
    this.tagName = tag.toUpperCase();
    this.attributes = props.attributes || {};
    this.children = children;
    this.hidden = !!props.hidden;
    this.rect = props.rect || { top: 10, bottom: 30, left: 10, right: 100 };
    this.id = props.id || "";
    this.name = props.name || "";
    this.type = props.type;
    this.value = props.value || "";
    this.checked = !!props.checked;
    this.disabled = !!props.disabled;
    this.href = props.href;
    this.innerText = props.text || "";
    this.textContent = props.text || "";
    this.labels = props.labels || [];
    this.tabIndex = props.tabIndex == null ? -1 : props.tabIndex;
    this.shadowRoot = props.shadowRoot || null;
  }
  getAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name) ? this.attributes[name] : null; }
  hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
  getClientRects() { return this.hidden ? [] : [this.rect]; }
  getBoundingClientRect() { return this.rect; }
}

function run(root, options) {
  const context = {
    console,
    WeakMap,
    document: { body: root, getElementById: () => null },
    getComputedStyle: (el) => ({ display: el.hidden ? "none" : "block", visibility: "visible" }),
    innerHeight: 600,
    innerWidth: 800
  };
  context.window = context;
  context.window.__safariAgentTree = options;
  vm.createContext(context);
  return { context, read: () => JSON.parse(vm.runInContext(source, context)) };
}

function page() {
  const shadowButton = new El("button", { text: "Shadow" });
  return new El("body", {}, [
    new El("a", { text: "About us", attributes: { href: "/about" }, href: "https://example.com/about" }),
    new El("p", { text: "Plain text is not listed" }),
    new El("input", { id: "email", type: "email", value: "ada@example.com", attributes: { placeholder: "you@example.com" } }),
    new El("input", { id: "pw", type: "password", value: "hunter2" }),
    new El("input", { id: "agree", type: "checkbox", checked: true, labels: [{ textContent: "I agree" }] }),
    new El("button", { text: "Hidden button", hidden: true }),
    new El("button", { text: "Far below", rect: { top: 5000, bottom: 5030, left: 10, right: 90 } }),
    new El("div", { text: "Fake button", attributes: { onclick: "go()" } }),
    new El("div", {}, [new El("button", { text: "Send", disabled: true })]),
    new El("div", { shadowRoot: { children: [shadowButton] } })
  ]);
}

test("lists visible interactive elements with roles, names and refs", () => {
  const { read } = run(page(), {});
  const names = read().items.map((item) => item.role + ":" + item.name);
  assert.deepEqual(names, [
    "link:About us",
    "textbox:you@example.com",
    "textbox:pw",
    "checkbox:I agree",
    "button:Far below",
    "clickable:Fake button",
    "button:Send",
    "button:Shadow"
  ]);
  assert.equal(read().items[0].href, "https://example.com/about");
  assert.equal(read().items.find((item) => item.name === "Send").disabled, true);
});

test("never exposes password values and keeps refs stable across reads", () => {
  const { read, context } = run(page(), {});
  const first = read();
  const password = first.items.find((item) => item.name === "pw");
  assert.equal(password.sensitive, true);
  assert.equal(Object.prototype.hasOwnProperty.call(password, "value"), false);
  assert.doesNotMatch(JSON.stringify(first), /hunter2/);
  assert.equal(first.items.find((item) => item.type === "email").value, "ada@example.com");
  const second = read();
  assert.deepEqual(second.items.map((item) => item.ref), first.items.map((item) => item.ref));
  const ref = first.items[0].ref;
  assert.equal(context.window.__safariAgentRefs.byId[ref].tagName, "A");
});

test("query filters by all words and viewportOnly drops off-screen elements", () => {
  assert.deepEqual(run(page(), { query: "button send" }).read().items.map((item) => item.name), ["Send"]);
  assert.deepEqual(run(page(), { query: "nothing like this" }).read().items, []);
  const visible = run(page(), { viewportOnly: true }).read().items.map((item) => item.name);
  assert.equal(visible.includes("Far below"), false);
  assert.equal(visible.includes("About us"), true);
});

test("max caps the result and reports truncation", () => {
  const result = run(page(), { max: 2 }).read();
  assert.equal(result.count, 2);
  assert.equal(result.truncated, true);
});
