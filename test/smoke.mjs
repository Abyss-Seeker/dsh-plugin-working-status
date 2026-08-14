// test/smoke.mjs — Node smoke test for the browser half with a minimal fake DOM.
// Exercises: materialization, apply, initial scan, observer application,
// click-to-edit (commit / cancel / reset), the settings-scope binding, and
// the Plugin configuration card (slot registration, staged form, save/reset).
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// ── minimal DOM shim ──────────────────────────────────────────────────────
class FakeElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.nodeType = 1;
    this.className = "";
    this.childNodes = [];
    this.firstChild = null;
    this.nextSibling = null;
    this.parentElement = null;
    this.style = {};
    this.scrollWidth = 40;
    this.attributes = new Map();
    this.listeners = {};
    this.isConnected = true;
  }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  append(child) {
    child.parentElement = this;
    const last = this.childNodes[this.childNodes.length - 1] ?? null;
    if (last !== null) last.nextSibling = child;
    this.childNodes.push(child);
    this.firstChild = this.childNodes[0] ?? null;
  }
  remove() {
    this.isConnected = false;
    if (this.parentElement !== null) {
      const idx = this.parentElement.childNodes.indexOf(this);
      if (idx !== -1) this.parentElement.childNodes.splice(idx, 1);
      this.parentElement.firstChild = this.parentElement.childNodes[0] ?? null;
      this.parentElement = null;
    }
  }
  querySelectorAll() { return fakeNodeList([]); }
  addEventListener(type, fn) { this.listeners[type] = fn; }
  focus() {}
  select() {}
  get value() { return this._value ?? ""; }
  set value(v) { this._value = String(v); }
}
const textNode = (value) => ({ nodeType: 3, nodeValue: value, parentElement: null });
const fakeNodeList = (arr) => ({ length: arr.length, item: (i) => arr[i] ?? null });
const el = (tag, props = {}) => Object.assign(new FakeElement(tag), props);

// status field with the shipped structure: text node "Deep diving..."
function makeStatus() {
  const node = el("div", {
    className: "Md3f7G_turnStatus",
    attributes: new Map([["role", "status"], ["aria-live", "polite"]]),
  });
  const label = textNode("Deep diving...");
  node.childNodes = [label];
  node.firstChild = label;
  return { node, label };
}

const listeners = {};
const observerCallbacks = [];
globalThis.Element = FakeElement;
globalThis.window = {
  __ModuleLoader__: { load: (handoff) => { globalThis.__handoff = handoff; } },
  addEventListener: (type, fn) => { listeners[type] = fn; },
  removeEventListener: () => {},
};
globalThis.document = {
  createElement: (tag) => el(tag),
  head: { append: () => {} },
  documentElement: el("html"),
  addEventListener: (type, fn) => { listeners[type] = fn; },
  removeEventListener: () => {},
  querySelectorAll: () => fakeNodeList([]),
};
globalThis.MutationObserver = class {
  constructor(cb) { observerCallbacks.push(cb); }
  observe() {}
  disconnect() {}
};
const localStore = new Map();
globalThis.localStorage = {
  getItem: (k) => (localStore.has(k) ? localStore.get(k) : null),
  setItem: (k, v) => localStore.set(k, String(v)),
  removeItem: (k) => localStore.delete(k),
};

// ── fake module table for the card path (react is never rendered) ────────
function makeSnapshotStore(init) {
  let state = init;
  const subs = new Set();
  return {
    getSnapshot: () => state,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    set: (next) => { state = next; for (const fn of [...subs]) fn(); },
    update: () => { throw new Error("unexpected update"); },
  };
}
const fakeRequire = (spec) => {
  if (spec === "react") return { useState: (v) => [v, () => {}] };
  if (spec === "react/jsx-runtime") return { jsx: (type) => (typeof type === "string" ? type : "component") };
  if (spec === "@deepseek-ai/dsh-client-runtime/client") return { createSnapshotStore: makeSnapshotStore };
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return {};
  throw new Error(`unexpected require: ${spec}`);
};

// ── materialize the bundle ────────────────────────────────────────────────
await import(pathToFileURL(join(here, "..", "lib", "client.js")).href);
const handoff = globalThis.__handoff;
const exports = handoff.factory(fakeRequire);
const assert = (cond, msg) => { if (!cond) throw new Error(`FAIL: ${msg}`); };

// ── apply with a fake client context ──────────────────────────────────────
localStore.set("dsh.turn-status.label", "Thinking hard...");
const effectDisposers = [];
let injectCb = null;
const ctx = {
  logger: { warn: (...args) => console.log("[warn]", ...args) },
  effect: (fn) => { const dispose = fn(); if (dispose) effectDisposers.push(dispose); },
  inject: (_deps, cb) => { injectCb = cb; },
};
exports.apply(ctx);
assert(typeof exports.apply === "function", "apply exported");
assert(observerCallbacks.length === 1, "observer constructed and observing");
assert(typeof listeners.click === "function", "click delegation registered");
const observerCb = observerCallbacks[0];

// ── a status field appears; the observer must apply the override ──────────
const { node, label } = makeStatus();
observerCb([{ addedNodes: fakeNodeList([node]), removedNodes: fakeNodeList([]) }]);
assert(label.nodeValue === "Thinking hard...", `override applied (got ${JSON.stringify(label.nodeValue)})`);

// React's per-second re-render leaves the text node alone: simulate a clock insert.
const clock = el("span", { className: "Md3f7G_turnStatusClock" });
node.append(clock);
assert(label.nodeValue === "Thinking hard...", "override survives clock insertion");

// ── click opens the editor ────────────────────────────────────────────────
listeners.click({ target: node });
assert(window.__dshWorkingStatusEditor.elements().length === 1, "click opens editor");

// ── commit a new value ────────────────────────────────────────────────────
const input = node.childNodes.find((n) => n.nodeType === 1 && n.tagName === "INPUT");
assert(input !== undefined, "editor input appended");
input.value = "  神游中  ";
input.listeners.keydown({ key: "Enter", preventDefault() {} });
assert(label.nodeValue === "神游中", `Enter commits trimmed value (got ${JSON.stringify(label.nodeValue)})`);
assert(localStore.get("dsh.turn-status.label") === "神游中", "localStorage mirror written");

// ── cancel path ───────────────────────────────────────────────────────────
listeners.click({ target: node });
const input2 = node.childNodes.find((n) => n.nodeType === 1 && n.tagName === "INPUT");
input2.value = "nope";
input2.listeners.keydown({ key: "Escape", preventDefault() {} });
assert(label.nodeValue === "神游中", "Escape cancels without changing the label");

// ── empty commit resets to the learned default ────────────────────────────
listeners.click({ target: node });
const input3 = node.childNodes.find((n) => n.nodeType === 1 && n.tagName === "INPUT");
input3.value = "   ";
input3.listeners.keydown({ key: "Enter", preventDefault() {} });
assert(label.nodeValue === "Deep diving...", `empty commit restores the original (got ${JSON.stringify(label.nodeValue)})`);
assert(localStore.has("dsh.turn-status.label") === false, "localStorage mirror cleared on reset");

// ── settings surface: host value wins over the local mirror ───────────────
localStore.set("dsh.turn-status.label", "local value");
function makeScope(initial) {
  let snap = initial;
  const subs = new Set();
  return {
    getSnapshot: () => snap,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    set: async (field, value) => {
      snap = { ...snap, user: { ...snap.user, [field]: value }, value: { ...snap.value, [field]: value } };
      for (const fn of [...subs]) fn();
    },
    unset: async (field) => {
      const user = { ...snap.user };
      delete user[field];
      snap = { ...snap, user, value: { ...snap.value, [field]: "Deep diving..." } };
      for (const fn of [...subs]) fn();
    },
  };
}
const slotRegistrations = [];
const dictionaryRegistrations = [];
const scope = makeScope({ status: "ready", writable: true, user: { label: "Host value" }, value: { label: "Host value" }, base: undefined });
const scopedCtx = {
  settingsScope: { bind: () => scope },
  locale: {
    bind: () => (key) => `t(${key})`,
    register: (ns, dict) => { dictionaryRegistrations.push({ ns, dict }); return () => {}; },
  },
  slots: {
    inject: (name, cb) => { const res = cb(); if (typeof res === "function") res(); },
    register: (options, component) => { slotRegistrations.push({ options, component }); return () => {}; },
  },
  effect: (fn) => { const dispose = fn(); if (dispose) effectDisposers.push(dispose); },
};
injectCb(scopedCtx);
assert(label.nodeValue === "Host value", `host settings value wins (got ${JSON.stringify(label.nodeValue)})`);
assert(dictionaryRegistrations.length === 1 && dictionaryRegistrations[0].ns === "working-status", "dictionaries registered");
assert(slotRegistrations.length === 1, "plugin card slot registered");
const cardReg = slotRegistrations[0];
assert(cardReg.options.id === "working-status" && cardReg.options.name === "settings.plugin.item", "card registered into settings.plugin.item");

// ── card staged form ──────────────────────────────────────────────────────
const face = cardReg.options.inject();
assert(face.hooks.workingStatusCard !== undefined, "card hook store injected");
assert(typeof face.save === "function" && typeof face.discard === "function" && typeof face.edit === "function" && typeof face.resetField === "function", "card actions injected");
let cardSnap = face.hooks.workingStatusCard.getSnapshot();
assert(cardSnap.text === "Host value" && cardSnap.overridden === true, `card shows the effective label (got ${JSON.stringify(cardSnap)})`);

face.edit("  全力工作中  ");
cardSnap = face.hooks.workingStatusCard.getSnapshot();
assert(cardSnap.dirty === true && cardSnap.text === "  全力工作中  ", "edit stages a draft");
await face.save();
cardSnap = face.hooks.workingStatusCard.getSnapshot();
assert(cardSnap.dirty === false && cardSnap.text === "全力工作中", `save clears the draft (got ${JSON.stringify(cardSnap)})`);
assert(scope.getSnapshot().user.label === "全力工作中", "host document updated (future channel)");
assert(localStore.get("dsh.turn-status.label") === "全力工作中", "local mirror updated");
assert(label.nodeValue === "全力工作中", "DOM label follows the card save");

face.resetField();
await face.save();
cardSnap = face.hooks.workingStatusCard.getSnapshot();
assert(cardSnap.dirty === false && cardSnap.text === "Deep diving...", `reset save clears cleanly (got ${JSON.stringify(cardSnap)})`);
assert(Object.hasOwn(scope.getSnapshot().user, "label") === false, "host override removed (future channel)");
assert(localStore.has("dsh.turn-status.label") === false, "local mirror cleared");
assert(label.nodeValue === "Deep diving...", `reset restores the default (got ${JSON.stringify(label.nodeValue)})`);

// ── disposal unwinds ──────────────────────────────────────────────────────
effectDisposers.forEach((dispose) => dispose());

console.log("smoke: all assertions passed");
