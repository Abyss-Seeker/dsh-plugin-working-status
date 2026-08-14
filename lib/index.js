// lib/index.js — Host half of dsh-plugin-working-status.
//
// Registers the `turn-status` user-settings namespace (single `label` field).
// Registration is lazy: it runs only when a settings provider is mounted, so
// this plugin also activates on compositions without user settings (the
// browser half then falls back to localStorage).
//
// Note on wire exposure: the Host API proxy serves only the namespaces in its
// fixed WEB_SETTINGS_NAMESPACES allowlist (plus model-provider namespaces) to
// Web clients; a namespace absent from that list answers
// `settings-not-exposed` even when registered. Exposing a namespace from
// `settings.register()` itself is documented deferred work in
// `dsh-host-apiproxy`. Until then this registration is inert for the browser
// (the browser half persists through its localStorage mirror instead), and it
// becomes live automatically once that deferred work lands.
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "@deepseek-ai/schemastery";

/** Settings namespace owned by this plugin (browser half binds the same name). */
export const TURN_STATUS_SETTINGS_NAMESPACE = "turn-status";

/** Field carrying the user's replacement for the status label text. */
export const TURN_STATUS_FIELD = "label";

/**
 * Durable section schema. The default mirrors the shipped English copy; the
 * browser half treats only a USER-provided value as an override, so the
 * default never suppresses a locale-specific label captured from a live
 * render.
 */
export const TurnStatusSettingsSchema = z.object({
  [TURN_STATUS_FIELD]: z.string().default("Deep diving..."),
});

/**
 * Register the durable status-label section when a settings provider exists.
 * @param ctx - Host context whose optional settings service owns the section.
 */
export function apply(ctx) {
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(settingsNamespace(TURN_STATUS_SETTINGS_NAMESPACE), TurnStatusSettingsSchema);
  });
}
