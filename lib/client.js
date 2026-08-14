// lib/client.js — Browser half of dsh-plugin-working-status (final bundle format).
//
// Registers a lazy CJS factory with the client module system, exactly like the
// built-in dsh.client bundles: executing this script only records the factory;
// the factory body (styles included) runs at materialization.
//
// Behavior:
//  * Watches the DOM for the running-turn status field
//    (div[role="status"][aria-live="polite"] carrying the `turnStatus`
//    CSS-module class) and swaps its label text node — never the element,
//    never the elapsed-time clock — with the user's override.
//  * Clicking the field opens an inline editor; Enter/blur commits, Escape
//    cancels, an empty commit restores the original text everywhere.
//  * Persists through the localStorage mirror (`dsh.turn-status.label`) —
//    cross-tab via the storage event, cross-session via the browser. The Host
//    `turn-status` settings namespace is registered for the future, but the
//    Host API proxy currently serves only its fixed namespace allowlist to
//    Web clients (`settings-not-exposed` otherwise), so the browser half
//    treats the Host channel as an optional, future read/write preference.
//  * Registers a "Working status" card into the Settings → Plugins →
//    Plugin configuration surface (`settings.plugin.item` slot): the same
//    label, editable and saved through a staged form over the plugin's own
//    override state (the card never depends on a wire-exposed namespace).
//  * All DOM writes are text-node value mutations applied after React commits
//    its DOM. React re-renders the clock every second but never diffs this
//    text node (its vdom text is constant), so the shimmer animation, clock,
//    ARIA live region, and the loading-time render are untouched.
window.__ModuleLoader__.load({
  id: "dsh-plugin-working-status",
  factory: (require) => {
    "use strict";
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    // ── constants ────────────────────────────────────────────────────────
    var PLUGIN_NAME = "working-status";
    var PACKAGE_ID = "dsh-plugin-working-status";
    var SETTINGS_NAMESPACE = "turn-status";   // durable storage format: keep for continuity
    var SETTINGS_FIELD = "label";
    var LOCAL_STORAGE_KEY = "dsh.turn-status.label";
    var DEFAULT_LABEL = "Deep diving...";
    var EDITOR_CLASS = "dsh-ws-editor";
    var DICTIONARY_NS = "working-status";

    // ── locale dictionaries ──────────────────────────────────────────────
    var en = {
      cardTitle: "Working status",
      cardDescription: "The status label shown while an agent turn is running.",
      labelField: "Status label",
      labelPlaceholder: "Deep diving...",
      labelHint: "Shown during every running turn. Leave blank and save to restore the built-in text.",
      overridden: "Overridden",
      reset: "Reset to default",
      readOnly: "This deployment stores settings read-only.",
      expand: "Show settings",
      collapse: "Hide settings",
      save: "Save",
      saving: "Saving…",
      discard: "Discard",
      unsaved: "Unsaved",
      saveFailed: "The deployment did not accept these values; they were left for you to correct."
    };
    var zh = {
      cardTitle: "工作状态",
      cardDescription: "Agent 轮次运行中显示的状态文字。",
      labelField: "状态文字",
      labelPlaceholder: "Deep diving...",
      labelHint: "每一轮运行中都会显示。留空保存即恢复内置默认文字。",
      overridden: "已覆盖",
      reset: "恢复默认",
      readOnly: "本部署的设置为只读。",
      expand: "展开设置",
      collapse: "收起设置",
      save: "保存",
      saving: "保存中…",
      discard: "放弃修改",
      unsaved: "未保存",
      saveFailed: "本部署没有接受这些值，已保留供你修改。"
    };

    // ── styles (factory side effect; attributed to this plugin for HMR) ──
    var style = document.createElement("style");
    style.setAttribute("data-plugin", PACKAGE_ID);
    style.textContent = [
      'div[role="status"][aria-live="polite"][class*="turnStatus"] { cursor: text; }',
      'div[role="status"][aria-live="polite"][class*="turnStatus"]:hover { outline: 1px solid var(--dsw-alias-border-l3, rgba(126, 134, 148, 0.4)); outline-offset: 2px; border-radius: 6px; }',
      "." + EDITOR_CLASS + " { box-sizing: border-box; height: 24px; min-width: 64px; max-width: 480px; margin-left: 4px; padding: 0 6px; border: 1px solid var(--dsw-alias-border-l2, #c9cdd4); border-radius: 6px; background: var(--dsw-alias-bg-layer-2, #ffffff); color: var(--dsw-alias-label-primary, #1f2329); -webkit-text-fill-color: var(--dsw-alias-label-primary, #1f2329); font: var(--dsw-font-s-strong-14); line-height: 22px; white-space: nowrap; outline: none; }",
      "." + EDITOR_CLASS + ":focus { border-color: var(--dsw-alias-state-business-primary, #4d6bfe); box-shadow: 0 0 0 2px rgba(77, 107, 254, 0.16); }",
      ".dsh-ws-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}",
      ".dsh-ws-card:hover{border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-ws-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-ws-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}",
      ".dsh-ws-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}",
      ".dsh-ws-head-text{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}",
      ".dsh-ws-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}",
      ".dsh-ws-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}",
      ".dsh-ws-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s;width:14px;height:14px;display:inline-flex;align-items:center;justify-content:center}",
      ".dsh-ws-chevron-open{transform:rotate(180deg)}",
      ".dsh-ws-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}",
      ".dsh-ws-readonly{color:var(--dsw-alias-label-tertiary);margin:12px 0 0;font-size:12px;line-height:1.5}",
      ".dsh-ws-pending{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}",
      ".dsh-ws-footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}",
      ".dsh-ws-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}",
      ".dsh-ws-discard,.dsh-ws-save{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}",
      ".dsh-ws-discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}",
      ".dsh-ws-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}",
      ".dsh-ws-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}",
      ".dsh-ws-discard:disabled,.dsh-ws-save:disabled{opacity:.4;cursor:default}",
      ".dsh-ws-discard:focus-visible,.dsh-ws-save:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}",
      ".dsh-ws-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}",
      ".dsh-ws-field-head{align-items:center;gap:8px;display:flex}",
      ".dsh-ws-field-label{min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:1.5}",
      ".dsh-ws-badges{align-items:center;gap:8px;display:inline-flex}",
      ".dsh-ws-badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}",
      ".dsh-ws-reset{font:inherit;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;padding:0;font-size:12px;line-height:1.5}",
      ".dsh-ws-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}",
      ".dsh-ws-reset:disabled{cursor:default}",
      ".dsh-ws-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}",
      ".dsh-ws-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}",
      ".dsh-ws-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}",
      ".dsh-ws-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}"
    ].join("\n");
    document.head.append(style);

    // ── DOM helpers ──────────────────────────────────────────────────────
    /** True only for the running-turn status field: a div live region whose
     * CSS-module local name is `turnStatus` (hash prefix is build-dependent,
     * the local name is not). */
    function isTurnStatus(el) {
      return el.nodeType === 1
        && el.tagName === "DIV"
        && el.getAttribute("role") === "status"
        && el.getAttribute("aria-live") === "polite"
        && typeof el.className === "string"
        && el.className.indexOf("turnStatus") !== -1;
    }

    /** First direct text-node child — the label React renders before the clock. */
    function labelNodeOf(el) {
      var child = el.firstChild;
      while (child !== null) {
        if (child.nodeType === 3) return child;
        child = child.nextSibling;
      }
      return null;
    }

    /** Nearest matching status ancestor of a click target, if any. */
    function closestStatus(from) {
      var node = from;
      while (node !== null && node.nodeType === 1) {
        if (isTurnStatus(node)) return node;
        node = node.parentElement;
      }
      return null;
    }

    /** All status fields inside a root Element or Document. */
    function scanStatusElements(root) {
      var found = [];
      if (isTurnStatus(root)) found.push(root);
      var list = root.querySelectorAll('div[role="status"][aria-live="polite"]');
      for (var i = 0; i < list.length; i++) if (isTurnStatus(list[i])) found.push(list[i]);
      return found;
    }

    // ── state ────────────────────────────────────────────────────────────
    var tracked = new Set();        // live status elements
    var editing = new Map();        // Element -> { input, textNode, previous }
    var defaultLabel = DEFAULT_LABEL; // learned from real React renders
    var lastApplied = null;         // last effective label written (string|null)
    var localOverride = null;       // localStorage mirror
    var hostScope = null;
    var hostSnapshot = null;
    var hostKnown = false;
    var hostOverride = null;        // string|null (null = no user value)
    var warned = new WeakSet();
    var log = null;
    var cardListener = null;       // republish hook for the Plugin configuration card

    function readLocal() {
      try {
        return localStorage.getItem(LOCAL_STORAGE_KEY);
      } catch (_unavailable) {
        return null;
      }
    }

    function effectiveLabel() {
      return hostKnown && hostOverride !== null ? hostOverride : localOverride;
    }

    function hostWritable() {
      var snap = hostSnapshot;
      return snap !== null && snap.status === "ready" && snap.writable === true;
    }

    function warnStructural(el) {
      if (warned.has(el)) return;
      warned.add(el);
      if (log !== null) log.warn("working-status: matched a status field without a direct text node; label override skipped");
    }

    // ── label application ────────────────────────────────────────────────
    /** Reconcile every tracked field with the effective label. React owns the
     * vdom, so only nodeValue mutations land here — the element, the clock,
     * and the animation stay untouched. */
    function refreshAll() {
      var label = effectiveLabel();
      tracked.forEach(function (el) {
        if (!el.isConnected) { tracked.delete(el); return; }
        if (editing.has(el)) return;
        var textNode = labelNodeOf(el);
        if (textNode === null) { warnStructural(el); return; }
        var current = textNode.nodeValue === null ? "" : textNode.nodeValue;
        if (label !== null) {
          if (current === label) return;
          if (current !== "" && current !== lastApplied) defaultLabel = current;
          textNode.nodeValue = label;
        } else if (current === lastApplied || current === "") {
          textNode.nodeValue = defaultLabel;
        } else if (current !== defaultLabel) {
          defaultLabel = current;
        }
      });
      lastApplied = label;
      if (cardListener !== null) cardListener();
    }

    // ── persistence ──────────────────────────────────────────────────────
    function persistLocal(value) {
      localOverride = value;
      try {
        if (value === null) localStorage.removeItem(LOCAL_STORAGE_KEY);
        else localStorage.setItem(LOCAL_STORAGE_KEY, value);
      } catch (_unavailable) { /* keep in-memory only */ }
    }

    /** Persist the override to the local mirror and the Host settings, then
     * re-apply. The returned promise settles the Host write when there is one
     * (rejections are contained; callers verify through the scope snapshot). */
    function setOverride(text) {
      persistLocal(text);
      var write = hostWritable() ? hostScope.set(SETTINGS_FIELD, text) : Promise.resolve();
      refreshAll();
      write.catch(function (_error) {});
      return write;
    }

    function clearOverride() {
      persistLocal(null);
      var write = hostWritable() ? hostScope.unset(SETTINGS_FIELD) : Promise.resolve();
      refreshAll();
      write.catch(function (_error) {});
      return write;
    }

    /** Bind the Host settings scope: user-layer value wins over the local
     * mirror; the scope drives re-application across tabs via the settings
     * invalidation stream. */
    function attachHost(scope, effectCtx) {
      hostScope = scope;
      var applySnapshot = function () {
        var snap = scope.getSnapshot();
        hostSnapshot = snap;
        if (snap.status === "loading") return; // initial read still in flight
        var value = null;
        if (snap.status === "ready" && snap.user !== null && snap.user !== void 0) {
          var field = snap.user[SETTINGS_FIELD];
          if (typeof field === "string" && field.trim() !== "") value = field;
        }
        var changed = !(hostKnown && hostOverride === value);
        hostKnown = true;
        hostOverride = value;
        if (changed) refreshAll();
      };
      effectCtx.effect(function () {
        var unsubscribe = scope.subscribe(applySnapshot);
        applySnapshot();
        return unsubscribe;
      }, "working-status: settings scope");
    }

    // ── inline editing ───────────────────────────────────────────────────
    function beginEdit(el) {
      var textNode = labelNodeOf(el);
      if (textNode === null) { warnStructural(el); return; }
      var previous = textNode.nodeValue === null ? "" : textNode.nodeValue;
      var input = document.createElement("input");
      input.type = "text";
      input.className = EDITOR_CLASS;
      input.spellcheck = false;
      input.autocomplete = "off";
      input.setAttribute("aria-label", "Status label editor");
      input.value = previous;
      textNode.nodeValue = ""; // hide React's node while the editor owns the label
      el.append(input);
      editing.set(el, { input: input, textNode: textNode, previous: previous });
      input.style.width = Math.min(Math.max(input.scrollWidth + 18, 64), 480) + "px";
      input.focus();
      input.select();
      input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); finishEdit(el, true); }
        else if (event.key === "Escape") { event.preventDefault(); finishEdit(el, false); }
      });
      input.addEventListener("blur", function () { finishEdit(el, true); });
    }

    function finishEdit(el, commit) {
      var state = editing.get(el);
      if (state === void 0) return;
      editing.delete(el);
      var input = state.input;
      var connected = input.isConnected;
      if (connected) input.remove();
      if (!connected) return; // field removed mid-edit: drop state, keep storage
      if (!commit) {
        state.textNode.nodeValue = state.previous;
        refreshAll();
        return;
      }
      var next = input.value.trim();
      if (next === "") clearOverride();
      else setOverride(next);
    }

    /** Drop edit state without committing (owner element left the DOM). */
    function abortEdit(el) {
      var state = editing.get(el);
      if (state === void 0) return;
      editing.delete(el);
      if (state.input.isConnected) state.input.remove();
    }

    // ── DOM observation ──────────────────────────────────────────────────
    var observer = new MutationObserver(function (records) {
      try {
        var changed = false;
        for (var i = 0; i < records.length; i++) {
          var record = records[i];
          var added = record.addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added.item(j);
            if (node.nodeType !== 1) continue;
            var found = scanStatusElements(node);
            for (var k = 0; k < found.length; k++) { tracked.add(found[k]); changed = true; }
          }
          var removed = record.removedNodes;
          for (var m = 0; m < removed.length; m++) {
            var gone = removed.item(m);
            if (gone.nodeType !== 1) continue;
            if (editing.has(gone)) abortEdit(gone);
            if (tracked.has(gone)) tracked.delete(gone);
          }
        }
        if (editing.size > 0) {
          editing.forEach(function (_state, el) { if (!el.isConnected) abortEdit(el); });
        }
        if (changed) refreshAll();
      } catch (error) {
        if (log !== null) log.warn("working-status: dom update failed");
      }
    });

    function onDocumentClick(event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var el = closestStatus(target);
      if (el === null || editing.has(el)) return;
      beginEdit(el);
    }

    /** Cross-tab mirror for pages without the settings transport. */
    function onStorage(event) {
      if (event.key !== null && event.key !== LOCAL_STORAGE_KEY) return;
      var value = readLocal();
      if (value === localOverride) return;
      localOverride = value;
      refreshAll();
    }

    // ── Plugin configuration card ────────────────────────────────────────
    /** Mount the "Working status" card into Settings → Plugins → Plugin
     * configuration. Requires are kept inside this path: the module-table
     * lookups run only when the settings surface exists, so the DOM editor
     * never depends on them. */
    function mountSettingsCard(scoped, scope, t) {
      var react = require("react");
      var jsx = require("react/jsx-runtime").jsx;
      var createSnapshotStore = require("@deepseek-ai/dsh-client-runtime/client").createSnapshotStore;
      var Chevron = null;
      try {
        var primitives = require("@deepseek-ai/dsh-client-ui-primitives");
        if (typeof primitives.IconChevronDownOutline14 === "function") Chevron = primitives.IconChevronDownOutline14;
      } catch (_missingPrimitives) { /* text chevron fallback */ }

      var css = {
        card: "dsh-ws-card", cardOpen: "dsh-ws-card-open", header: "dsh-ws-header",
        headText: "dsh-ws-head-text", name: "dsh-ws-name", description: "dsh-ws-description",
        chevron: "dsh-ws-chevron", chevronOpen: "dsh-ws-chevron-open", body: "dsh-ws-body",
        readonly: "dsh-ws-readonly", pending: "dsh-ws-pending", footer: "dsh-ws-footer",
        failed: "dsh-ws-failed", discard: "dsh-ws-discard", save: "dsh-ws-save",
        field: "dsh-ws-field", fieldHead: "dsh-ws-field-head", fieldLabel: "dsh-ws-field-label",
        badges: "dsh-ws-badges", badge: "dsh-ws-badge", reset: "dsh-ws-reset",
        input: "dsh-ws-input", hint: "dsh-ws-hint"
      };
      function cx() {
        var parts = [];
        for (var i = 0; i < arguments.length; i++) if (arguments[i]) parts.push(arguments[i]);
        return parts.join(" ");
      }

      /**
       * One staged field over the plugin's own override state: text edits are
       * drafts; save is the single point where a draft becomes a write
       * (through the shared setOverride/clearOverride path, so the inline
       * editor and the card stay consistent).
       *
       * The card does NOT read the `turn-status` settings scope: the Host API
       * proxy serves only its fixed namespace allowlist to Web clients, so a
       * third-party namespace always reads as unavailable there. The card is
       * therefore always visible and mirrors the plugin's own persistence
       * (localStorage today; the registered Host namespace activates by
       * itself if a future DSH exposes it).
       */
      function createCard() {
        var staged = void 0; // { text, clear } | undefined
        var saving = false;
        var store = createSnapshotStore({
          text: "", overridden: false, dirty: false, saving: false
        });
        function publish() {
          store.set({
            text: staged !== void 0 ? staged.text : (effectiveLabel() ?? defaultLabel),
            overridden: staged !== void 0 ? !staged.clear : effectiveLabel() !== null,
            dirty: staged !== void 0,
            saving: saving
          });
        }
        publish();
        return {
          publish: publish,
          inject: function () {
            return {
              hooks: { workingStatusCard: store },
              edit: function (text) { staged = { text: text, clear: false }; publish(); },
              resetField: function () { staged = { text: "", clear: true }; publish(); },
              discard: function () { if (staged === void 0) return; staged = void 0; publish(); },
              save: async function () {
                if (staged === void 0 || saving) return;
                var edit = staged;
                saving = true;
                publish();
                var text = edit.text.trim();
                if (!edit.clear && text === "") edit = { text: "", clear: true };
                if (edit.clear) await clearOverride();
                else await setOverride(text);
                staged = void 0;
                saving = false;
                publish();
              }
            };
          }
        };
      }

      /** Render the card. Always visible: its data is the plugin's own
       * override, not a wire-exposed settings namespace. */
      function WorkingStatusCard(props) {
        var state = props.useWorkingStatusCard(function (snapshot) { return snapshot; });
        var openState = react.useState(false);
        var open = openState[0];
        var setOpen = openState[1];
        var blocked = !state.dirty || state.saving;
        return jsx("li", {
          className: cx(css.card, open && css.cardOpen),
          children: [
            jsx("button", {
              type: "button",
              className: css.header,
              "aria-expanded": open,
              "aria-label": t(open ? "collapse" : "expand") + ": " + t("cardTitle"),
              onClick: function () { setOpen(!open); },
              children: [
                jsx("span", {
                  className: css.headText,
                  children: [
                    jsx("span", { className: css.name, children: t("cardTitle") }),
                    jsx("span", { className: css.description, children: t("cardDescription") })
                  ]
                }),
                state.dirty ? jsx("span", { className: css.pending, children: t("unsaved") }) : null,
                jsx(Chevron !== null ? Chevron : "span", {
                  className: cx(css.chevron, open && css.chevronOpen),
                  children: Chevron !== null ? void 0 : "▾"
                })
              ]
            }),
            open ? jsx("div", {
              className: css.body,
              children: [
                jsx("div", {
                  className: css.field,
                  children: [
                    jsx("div", {
                      className: css.fieldHead,
                      children: [
                        jsx("label", { className: css.fieldLabel, htmlFor: "dsh-ws-label", children: t("labelField") }),
                        state.overridden ? jsx("span", {
                          className: css.badges,
                          children: [
                            jsx("span", { className: css.badge, children: t("overridden") }),
                            jsx("button", {
                              type: "button",
                              className: css.reset,
                              onClick: props.resetField,
                              children: t("reset")
                            })
                          ]
                        }) : null
                      ]
                    }),
                    jsx("input", {
                      id: "dsh-ws-label",
                      className: css.input,
                      type: "text",
                      value: state.text,
                      placeholder: t("labelPlaceholder"),
                      onChange: function (event) { props.edit(event.target.value); }
                    }),
                    jsx("p", { className: css.hint, children: t("labelHint") })
                  ]
                }),
                jsx("div", {
                  className: css.footer,
                  children: [
                    jsx("button", {
                      type: "button",
                      className: css.discard,
                      disabled: !state.dirty || state.saving,
                      onClick: props.discard,
                      children: t("discard")
                    }),
                    jsx("button", {
                      type: "button",
                      className: css.save,
                      disabled: blocked,
                      onClick: props.save,
                      children: t(state.saving ? "saving" : "save")
                    })
                  ]
                })
              ]
            }) : null
          ]
        });
      }

      var card = createCard();
      cardListener = card.publish;
      scoped.slots.inject("settings.plugin.item", function () {
        var dispose = scoped.slots.register({
          name: "settings.plugin.item",
          id: "working-status",
          order: 30,
          locale: DICTIONARY_NS,
          inject: function () { return card.inject(); }
        }, WorkingStatusCard);
        return function () {
          cardListener = null;
          if (typeof dispose === "function") dispose();
        };
      });
    }

    // ── plugin entry ─────────────────────────────────────────────────────
    /** Mount the editor (initial scan, observation, click delegation) and the
     * lazy settings surface (Host binding, dictionaries, configuration card).
     * Everything is effect-scoped so disposal unwinds cleanly; nothing blocks
     * the boot render. */
    function apply(ctx) {
      log = ctx.logger;
      localOverride = readLocal();
      window.__dshWorkingStatusEditor = {
        elements: function () { return Array.from(tracked); },
        label: effectiveLabel
      };

      ctx.effect(function () {
        var found = scanStatusElements(document);
        for (var i = 0; i < found.length; i++) tracked.add(found[i]);
        if (found.length > 0) refreshAll();
        observer.observe(document.documentElement, { childList: true, subtree: true });
        document.addEventListener("click", onDocumentClick, true);
        window.addEventListener("storage", onStorage);
        return function () {
          observer.disconnect();
          document.removeEventListener("click", onDocumentClick, true);
          window.removeEventListener("storage", onStorage);
          editing.forEach(function (_state, el) { abortEdit(el); });
          tracked.clear();
        };
      }, "working-status: dom surface");

      ctx.inject(["slots", "locale", "settingsScope"], function (scoped) {
        var t = scoped.locale.bind(DICTIONARY_NS);
        scoped.effect(function () {
          return scoped.locale.register(DICTIONARY_NS, { zh: zh, en: en });
        }, "working-status: dictionaries");
        var scope = scoped.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
        attachHost(scope, scoped);
        try {
          mountSettingsCard(scoped, scope, t);
        } catch (error) {
          if (log !== null) {
            log.warn("working-status: settings card unavailable");
            log.warn(error);
          }
        }
      });
    }

    exports.apply = apply;
    exports.inject = [];
    exports.name = PLUGIN_NAME;
    return module.exports;
  }
});
