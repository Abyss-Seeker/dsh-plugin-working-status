# dsh-plugin-working-status

Click-to-edit override for the running-turn status label — the shimmering
"Deep diving..." text (with the elapsed-time clock) that the DeepSeek Harness
Web GUI renders while a turn is running.

## What it does

- **Click the field to edit.** Click anywhere on the status field (label or
  clock area) to open a small inline editor pre-filled with the current text.
  `Enter` or clicking away commits, `Esc` cancels.
- **Global replacement.** The edited text replaces the label on every current
  and future status field — every turn, every session, after page reloads and
  app restarts.
- **Empty commit restores the original.** Clear the field and commit to reset
  the label to the built-in text (captured from the live render, so it follows
  whatever the UI actually displays, in any language).
- **Plugin configuration card.** A "Working status" card appears under
  Settings → Plugins → Plugin configuration with the same label as a staged
  form (Save / Discard / Reset to default). The card is always visible and
  edits the plugin's own override state — it does not depend on a
  wire-exposed settings namespace (see below).
- **Style-safe.** The plugin only mutates the label's text node after React
  commits its DOM. The shimmer animation, the elapsed-time clock, the ARIA
  live region, and the loading-time render are untouched.

## How it persists

The override is stored in the browser's localStorage mirror
(`dsh.turn-status.label`) — shared across every tab of the origin and kept
across reloads and restarts; remote pages work the same way.

The Host half also registers the `turn-status` settings namespace (field
`label`) so the value could live in the Host user-settings document like the
app's own preferences. In the current DSH version this channel is inert for
Web clients: `dsh-host-apiproxy` serves only its fixed
`WEB_SETTINGS_NAMESPACES` allowlist (plus model-provider namespaces) and
answers `settings-not-exposed` for anything else, even when the namespace is
registered. Exposing a namespace from `settings.register()` itself is
documented deferred work in that package; when it lands, this plugin's
browser half starts preferring the Host value automatically, with the
localStorage mirror as fallback. The namespace and storage key keep their
original names so nothing is lost either way.

## Installation

This package is a dual-face DSH plugin: a trivial Host half (registers the
settings namespace) plus the browser half (`dsh.client`, platform `web`).

1. Install the package into the profile with `dsh plugin` (forwards to pnpm;
   works for file paths, registry packages, and git repositories — no build
   step is needed, the checked-in `lib/` is the artifact):

   ```sh
   dsh plugin --profile web add github:Abyss-Seeker/not-deep-diving-dsh-plugin
   ```

   Equivalent direct specs:

   ```sh
   dsh plugin --profile web add git+https://github.com/Abyss-Seeker/not-deep-diving-dsh-plugin.git
   dsh plugin --profile web add file:<path-to-this-directory>
   ```

   pnpm-less alternative (a real directory copy into the profile, the same
   resolution shape a git install produces):

   ```sh
   node scripts/install.mjs "$DSH_HOME/profiles/web"
   ```

2. Enable the row in the profile's patch layer,
   `$DSH_HOME/profiles/web/cordis.patch.yml`:

   ```yaml
   - insert:
       - id: working-status-editor
         name: dsh-plugin-working-status
   ```

3. Reload the already-open GUI page (the boot graph is injected into
   `index.html`; the running server picks the new entry up live, the browser
   needs one refresh). Settings → Plugins lists the new entry.

Re-run step 1 after editing the sources to sync the installed copy.

## Configuration

- The inline status editor and the Plugin configuration card are the intended
  surfaces; both write the same override. The Host `turn-status` settings
  namespace (field `label`, string) is registered for future versions — see
  the persistence note above.
- `window.__dshWorkingStatusEditor` exposes `elements()` (matched DOM fields)
  and `label()` (the effective label) for diagnostics.

## Compatibility

Targets the shipped `ui-conversation` structure: the status field is
identified by `role="status"`, `aria-live="polite"`, and the stable
`turnStatus` CSS-module local name (the hash prefix may change between DSH
builds; the local name does not). If a DSH update renames that class, the
plugin logs a warning per field and stops rewriting rather than corrupting
the DOM. The Plugin configuration card registers into the
`settings.plugin.item` slot declared by `ui-settings-plugins`; without that
surface, the click-to-edit behavior still works.
