# Providers screen redesign — design doc

**Date:** 2026-06-01
**Status:** Awaiting implementation plan
**Scope:** `src/components/Providers/` and its supporting schema, plus a new `healthcheck()` capability on the `IMusicProvider` interface.

## Why

The current screen (`src/components/Providers/index.tsx`) treats provider configuration as a generic form: a permanent row of seven `+ Add <type>` buttons, a vertical stack of identical `bg-base-200` cards, one global Save button at the bottom. It throws away every piece of structured information the registry already carries — capabilities (`sync` / `search` / `stream`), repeatable-vs-singleton, per-instance identity — and it has no concept of whether a configured connection actually works. With two Navidromes configured, the cards are indistinguishable except for the URL buried inside the form.

This redesign reframes the screen as a **Connections panel**: a live, scannable list of music sources, each with real-time health, edited atomically, with the picker collapsed out of the steady state.

## Six decisions (locked)

1. **Mental model:** Connections panel. Steady-state-first, not picker-first.
2. **Status:** Live health checks via a new `IMusicProvider.healthcheck()` method. On mount, on refresh, after save. Real network probes; CORS failures are a true negative (provider is unusable anyway).
3. **Save model:** Per-card explicit Save / Cancel (visible only when that card is dirty). No global Save button. The `enabled` toggle autosaves on flip — no validation needed.
4. **Per-instance identity:** Optional `name` field (Label). Card title defaults to the hostname of `baseUrl`; the label, when set, overrides it. Schema change is additive: `name?: string`.
5. **Picker:** Full-bleed tile picker as the empty state (sells the product). Once ≥1 source is configured, the picker collapses into a single `+ Add source` button in the panel header, opening the same tile grid as a modal. Singleton types already configured render disabled with a "Connected" badge.
6. **Card visual:** Hardware-rack density with collapse-by-default. Connected & clean cards render as a single line; dirty / errored / clicked cards expand into the edit form.

## What changes, file by file

### `src/types/providers.ts` *(schema additions)*

- Add `name?: string` to a provider instance's stored settings (orthogonal to the registry schema).
- Add a `HealthStatus` union: `'connected' | 'checking' | 'unreachable' | 'auth_failed' | 'disabled' | 'unknown'`.
- Add a `HealthCheckResult` type: `{ status: HealthStatus; error?: string; latencyMs?: number; checkedAt: number }`.

### `src/providers/IMusicProvider.ts` *(interface)*

Add an optional method:

```ts
healthcheck?(config: ProviderConfig): Promise<HealthCheckResult>
```

Optional so existing providers don't break compilation; the UI treats `undefined` as `'unknown'` and skips the dot animation.

### Per-provider implementations *(small, bounded)*

| Provider | Implementation |
|---|---|
| `SubsonicApiProvider` | `GET {baseUrl}/rest/ping.view?u=&p=&v=1.16.1&c=deplayer&f=json` — parses `status` field, `failed` with `code=40` → `auth_failed`. |
| `JellyfinProvider` | `GET {baseUrl}/System/Info/Public` for reachability, then `GET /Users/Me` with `X-Emby-Token` for auth. |
| `MstreamApiProvider` | `POST {baseUrl}/api/v1/ping` (no auth needed for current usage). |
| `youtube-dl-server` | `GET {url}/api/info?url=https://example.com` → 200/4xx both mean reachable. |
| `ipfs` | `HEAD https://ipfs.io/ipfs/{hash}` (gateway probe, since browser can't talk to a daemon). |
| `itunes`, `musicbrainz` | No config, no `healthcheck` — UI shows `enabled` / `disabled` only. |

All checks have a 5-second timeout. Network errors → `unreachable`. HTTP 401/403 → `auth_failed`.

### `src/components/Providers/index.tsx` *(rewrite)*

Becomes a thin shell: panel header (`Sources` title, `+ Add source` button when populated), empty-state picker when no instances exist, list of `<ConnectionCard>` otherwise. No Formik wrapping the whole page — each card owns its own form.

### New: `src/components/Providers/ConnectionCard.tsx`

The card itself. Two visual states (collapsed row / expanded form), driven by:

- `isExpanded` local state, true by default if `status === 'auth_failed' | 'unreachable'` or if the card is dirty.
- A single click anywhere on the collapsed row toggles expansion.

Collapsed row (one line, ~48px tall):

```
● Home Navidrome              [enabled ◉]  ⋯
  music.example.com · sync search stream · synced 4m ago
```

Expanded card adds:

```
─────────────────────────────────────────────────────────
  Label        [ Home Navidrome                        ]
  Server URL   [ https://music.example.com             ]
  Username     [ genar                                 ]
  Password     [ ••••••••                          👁  ]

  [Test connection]              [Cancel]  [Save]
```

`⋯` overflow menu: `Test connection` · `Duplicate` (repeatable types only) · `Remove…` (opens a confirm dialog; destructive, irreversible, mentions credentials are deleted).

### New: `src/components/Providers/AddSourceModal.tsx`

The picker, reused in both the empty state (rendered inline, full-bleed) and the populated state (rendered as a daisyUI modal). Tile grid of all 7 provider types:

```
┌──────────────────────────┐
│ [icon]  Subsonic         │
│         Self-hosted music server, Subsonic-compatible.
│         sync · search · stream
└──────────────────────────┘
```

Singleton tiles whose type already has one configured instance render with a grey `Connected` badge and `aria-disabled`.

### New: `src/components/Providers/StatusDot.tsx`

Stateless presentational component. Renders the 6 states (`connected` / `checking` / `unreachable` / `auth_failed` / `disabled` / `unknown`) as a 8px dot. `checking` pulses (CSS keyframe, opacity only — never animates layout properties per impeccable's motion law). `disabled` is a hollow ring; `unknown` is a neutral filled dot.

Colors (OKLCH, tinted toward the existing daisyUI theme — actual values land during implementation):

- `connected` → `oklch(0.72 0.16 145)` (green, base-tinted)
- `checking` → `oklch(0.78 0.14 75)` (amber)
- `auth_failed`, `unreachable` → `oklch(0.65 0.20 25)` (red)
- `disabled` → hollow ring at `oklch(0.55 0.01 250)` (neutral)
- `unknown` → `oklch(0.55 0.01 250)` filled

### New: `src/stores/livestore/hooks/useProviderHealth.ts`

Hook that returns `{ status, error, latencyMs, checkedAt, refresh }` for a given provider instance key. Internally:

- Calls `healthcheck()` on mount and whenever the instance's config changes.
- `refresh()` exposed for the per-card refresh button + post-save.
- Disabled instances skip the probe entirely and return `'disabled'`.
- Debounces concurrent checks for the same instance.

Status is **not** persisted to LiveStore — it's session-only ephemeral state. A `useRef` + `useState` per hook instance is enough; no global store needed.

### Removed

- `src/components/Providers/ProviderButton.tsx` — replaced by tiles inside `AddSourceModal`.
- The single global Save button + bottom toast row in `index.tsx`.
- The literal "Select one of the providers below to configure it." sentence.

## Interaction details

**Adding a source.** Click `+ Add source` → modal opens with tile grid → click a tile → modal closes, a new card is appended in expanded state with empty fields, focused on the first input. Save is disabled until required fields validate. Cancel discards the new card entirely.

**Removing a source.** Card overflow menu → `Remove…` → daisyUI modal: *"Remove [name]? The connection's credentials will be deleted. This cannot be undone."* → confirm → card removes, settings save, no toast (the absence is the feedback).

**Editing.** Click a collapsed card → expands. Edits make the card dirty (visible Save/Cancel footer). Save commits this card's slice to LiveStore via the existing `saveSettingsAction`, then triggers a refresh of the health probe. Cancel reverts the form's local state. Other cards are not touched.

**Enabled toggle.** Lives in the collapsed row, top-right of the card. Flipping it autosaves immediately; on enable, kicks off a health check; on disable, the dot turns hollow and the card stops probing. No "dirty" state for the toggle.

**First run.** Panel header shows just `Sources` (no `+ Add source` button — would be redundant). Full-bleed tile grid below, with a one-sentence intro: *"Connect a music source to get started."* Selecting a tile transitions to the populated state with the new card in expanded mode.

## Accessibility

- Status dots have an `aria-label` carrying the textual status; sighted users get the dot, screen readers get the words.
- Collapsed card is a `<button>` (full-row click target). Expansion state via `aria-expanded`.
- Expanded form is a regular `<form>` with labelled inputs; password field has a visibility toggle (`aria-pressed`).
- `+ Add source` modal: focus trap, ESC to close, focus returns to the trigger.
- Status dot's color is never the sole signal — capability chips and the textual status line carry the same info.

## What we deliberately don't do

- **No global save bar.** Each card is its own unit.
- **No autosave on field blur.** Validation interdependencies (URL + user + password) make this hostile. Only the `enabled` toggle autosaves.
- **No persisted health state.** Stale "last known status" lies more than it helps; we probe on mount.
- **No drag-to-reorder.** Order doesn't affect playback behavior (providers are matched by capability, not order).
- **No "import / export connections" feature.** Out of scope; addressable later.
- **No per-provider branding logos beyond what's already in `Icon`.** The existing `Icon` component's set covers Subsonic, Jellyfin, IPFS, YouTube; the rest get a generic server icon. Custom SVGs are a polish pass, not a redesign blocker.

## Acceptance criteria

1. Fresh install with zero configured providers shows the tile picker as the empty state, not a row of `+` buttons over a blank panel.
2. Configured Navidrome with valid creds shows a green dot, collapsed row, hostname as title, capability chips, and a "synced Nm ago" line driven by the existing Subsonic sync timestamp.
3. Same Navidrome with wrong password shows a red dot, `auth_failed`, auto-expanded card with the error inline above the password field.
4. Same Navidrome offline shows a red dot, `unreachable`, auto-expanded card.
5. Two Navidrome instances are distinguishable in the collapsed list by their hostnames (default) or labels (when set).
6. Adding `itunes` after one already exists: the tile is disabled in the picker with a "Connected" badge.
7. Editing one card's URL and clicking Save does not refetch / disturb any other card's health probe.
8. Toggling `enabled` off makes the dot hollow within 100ms and stops the health probe; toggling on re-probes.
9. Removing a card requires explicit confirmation that mentions credentials are lost.
10. The screen passes the impeccable "AI slop test" — no side-stripe borders, no gradient text, no hero-metric template, no glassmorphism, no identical card grid (cards collapse so the grid disappears in steady state).

## Out-of-scope follow-ups

- Persisting connection telemetry (last 24h uptime, response time history) — interesting but a separate feature.
- Server-side health checks via a worker (would dodge CORS) — orthogonal infrastructure decision.
- Connection import/export, sharing, profiles.

## Next step

Per the brainstorming skill: invoke `superpowers:writing-plans` with this design doc as input to produce the implementation plan. **That is the next step before any code is written.**
