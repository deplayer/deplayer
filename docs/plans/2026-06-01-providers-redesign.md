# Providers Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild `src/components/Providers/` as a Connections panel with live health checks, per-card atomic editing, collapse-by-default rows, and a tile picker that takes over the screen only in the empty state.

**Architecture:** Three new layers added under a thin page shell. (1) A `healthcheck()` method on the `IMusicProvider` interface, implemented per provider (Subsonic/Jellyfin/Mstream/youtube-dl-server only — `itunes` and `musicbrainz` have no config). (2) A session-only `useProviderHealth` hook that probes on mount, on refresh, and after save — no LiveStore persistence. (3) Presentational components (`StatusDot`, `AddSourceModal`, `ConnectionCard`) that consume the hook and the existing settings save flow. Per-card forms manage their own dirty state and call the existing `saveSettingsAction` with a single-instance slice. The `enabled` toggle autosaves; everything else needs explicit Save.

**Tech Stack:** React + TypeScript, Formik (per-card, not page-level), daisyUI / Tailwind, Vitest + @testing-library/react, axios for healthchecks (already a dep via `SubsonicApiProvider`). LiveStore is the persistence target; Redux is unchanged.

**Design source of truth:** [`docs/plans/2026-06-01-providers-redesign-design.md`](./2026-06-01-providers-redesign-design.md). Read it before Task 1.

---

## Conventions for every task

- TDD: failing test first, run it red, implement, run it green, commit.
- Tests live next to the file under test as `*.spec.ts(x)`. Vitest, `@testing-library/react`, `userEvent`.
- **Never** use `getByTitle` (repo rule). Use `getByRole`, `getByLabelText`, `getByText`, or `getByTestId`.
- Named exports only. No `import React`. Use the `@/` alias only if you see it elsewhere in the touched directory — the Providers folder uses relative paths today; match that.
- Run only the spec(s) you touched: `npm test -- path/to/file.spec.tsx`.
- Lint only the files you touched: `npx eslint --max-warnings 0 path/to/file.ts path/to/file.spec.ts` (repo lint is dirty globally — do not run repo-wide lint).
- Commit after each task. Commit message format: `feat(providers): <task>` or `test(providers): <task>` or `refactor(providers): <task>`.

---

## Task 1: HealthStatus + HealthCheckResult types

**Files:**
- Modify: `src/types/providers.ts`
- Test: `src/types/providers.spec.ts` *(new — a tiny type-presence test; this file currently doesn't exist, that's fine)*

**Step 1: Write the failing test**

```ts
// src/types/providers.spec.ts
import { describe, it, expect } from 'vitest'
import type { HealthStatus, HealthCheckResult } from './providers'

describe('provider health types', () => {
  it('HealthStatus accepts the six documented states', () => {
    const states: HealthStatus[] = [
      'connected', 'checking', 'unreachable', 'authFailed', 'disabled', 'unknown',
    ]
    expect(states).toHaveLength(6)
  })

  it('HealthCheckResult carries status, optional error, optional latency, and checkedAt', () => {
    const ok: HealthCheckResult = { status: 'connected', latencyMs: 42, checkedAt: 0 }
    const bad: HealthCheckResult = { status: 'authFailed', error: 'wrong password', checkedAt: 0 }
    expect(ok.status).toBe('connected')
    expect(bad.error).toBe('wrong password')
  })
})
```

**Step 2: Run test to verify it fails**

`npm test -- src/types/providers.spec.ts`
Expected: TS compile error — types not exported.

**Step 3: Write minimal implementation**

Append to `src/types/providers.ts`:

```ts
export type HealthStatus =
  | 'connected'
  | 'checking'
  | 'unreachable'
  | 'authFailed'
  | 'disabled'
  | 'unknown'

export type HealthCheckResult = {
  status: HealthStatus
  error?: string
  latencyMs?: number
  checkedAt: number
}
```

**Step 4: Run test to verify it passes**

`npm test -- src/types/providers.spec.ts` → PASS.

**Step 5: Commit**

```bash
git add src/types/providers.ts src/types/providers.spec.ts
git commit -m "feat(providers): add HealthStatus and HealthCheckResult types"
```

---

## Task 2: Optional healthcheck() on IMusicProvider

**Files:**
- Modify: `src/providers/IMusicProvider.ts`

No test — this is a pure interface change. Compilation is the test (existing providers must still satisfy the interface because the method is optional).

**Step 1: Modify the interface**

Add the import and method to `src/providers/IMusicProvider.ts`:

```ts
import type { HealthCheckResult } from '../types/providers'

// ...inside `interface IMusicProvider`:
  /**
   * Probe the underlying service. Optional — providers without remote config
   * (itunes, musicbrainz) omit it; the UI treats absence as 'unknown'.
   * Implementations must resolve within ~5s; callers do not enforce a timeout.
   */
  healthcheck?(): Promise<HealthCheckResult>
```

**Step 2: Verify no existing providers break**

`npm test -- src/providers/` → all existing provider specs still pass.
`npx tsc --noEmit` → no errors.

**Step 3: Commit**

```bash
git add src/providers/IMusicProvider.ts
git commit -m "feat(providers): add optional healthcheck() to IMusicProvider"
```

---

## Task 3: SubsonicApiProvider.healthcheck()

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`
- Test: `src/providers/SubsonicApiProvider.spec.ts` *(append to existing)*

**Step 1: Write the failing tests**

Append three cases to `src/providers/SubsonicApiProvider.spec.ts`:

```ts
import axios from 'axios'
import { vi } from 'vitest'

describe('SubsonicApiProvider.healthcheck', () => {
  beforeEach(() => vi.restoreAllMocks())

  const make = () => new SubsonicApiProvider(
    { baseUrl: 'https://nav.example.com', user: 'u', password: 'p' },
    'subsonic',
  )

  it('returns connected when ping responds with status="ok"', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: { 'subsonic-response': { status: 'ok', version: '1.16.1' } },
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('connected')
    expect(typeof res.checkedAt).toBe('number')
  })

  it('returns authFailed on error code 40', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: { 'subsonic-response': { status: 'failed', error: { code: 40, message: 'wrong password' } } },
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('authFailed')
    expect(res.error).toBe('wrong password')
  })

  it('returns unreachable on network error', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('ECONNREFUSED'))
    const res = await make().healthcheck!()
    expect(res.status).toBe('unreachable')
    expect(res.error).toContain('ECONNREFUSED')
  })
})
```

**Step 2: Run to confirm red**

`npm test -- src/providers/SubsonicApiProvider.spec.ts` → fails (`healthcheck` undefined).

**Step 3: Implement**

Add to `SubsonicApiProvider` class (use the existing `appName = 'deplayer'` and Subsonic API version `1.16.1`).

Add the type import: `import type { HealthCheckResult } from '../types/providers'`.

Declare a local response type near the existing `SubsonicAlbum` / `SubsonicSong` types (do not export):

```ts
type SubsonicPingResponse = {
  status: 'ok' | 'failed'
  version?: string
  error?: { code: number; message: string }
}
```

The method:

```ts
async healthcheck(): Promise<HealthCheckResult> {
  const url = `${this.baseUrl}/rest/ping.view?u=${encodeURIComponent(this.user)}&p=${encodeURIComponent(this.password)}&c=deplayer&v=1.16.1&f=json`
  const t0 = Date.now()
  try {
    const { data } = await axios.get(url, { timeout: 5000 })
    const r: SubsonicPingResponse | undefined = data?.['subsonic-response']
    const checkedAt = Date.now()
    const latencyMs = checkedAt - t0
    if (r?.status === 'ok') return { status: 'connected', latencyMs, checkedAt }
    if (r?.error?.code === 40) {
      return { status: 'authFailed', error: r.error.message, checkedAt, latencyMs }
    }
    return { status: 'unreachable', error: r?.error?.message ?? 'Unknown', checkedAt, latencyMs }
  } catch (e) {
    const checkedAt = Date.now()
    return {
      status: 'unreachable',
      error: e instanceof Error ? e.message : String(e),
      checkedAt,
      latencyMs: checkedAt - t0,
    }
  }
}
```

**Always return `latencyMs`** — including on `catch`. This is a template defect that propagates to Tasks 4–6 if missed.

**Step 4: Run to confirm green**

`npm test -- src/providers/SubsonicApiProvider.spec.ts` → PASS.

**Step 5: Commit**

```bash
git add src/providers/SubsonicApiProvider.ts src/providers/SubsonicApiProvider.spec.ts
git commit -m "feat(providers): subsonic healthcheck via /rest/ping.view"
```

---

## Task 4: JellyfinProvider.healthcheck()

**Files:**
- Modify: `src/providers/JellyfinProvider.ts`
- Test: `src/providers/JellyfinProvider.spec.ts` *(create if absent — follow the Subsonic test shape above)*

**Step 1: Write failing tests**

Three cases, same shape as Task 3:
- `connected` — `/System/Info/Public` returns 200 AND `/Users/Me` returns 200 with the configured user.
- `authFailed` — `/System/Info/Public` returns 200 but `/Users/Me` returns 401.
- `unreachable` — `/System/Info/Public` rejects.

Mock `axios.get` to dispatch on the URL substring (`'/System/Info/Public'` vs `'/Users/Me'`).

**Step 2: Run, confirm red.**

**Step 3: Implement** following Subsonic's pattern. Use the existing class's `baseUrl` / `apiKey`. The `X-Emby-Token` header carries the API key.

**Step 4: Run, confirm green.**

**Step 5: Commit:** `feat(providers): jellyfin healthcheck via System/Info/Public + Users/Me`.

---

## Task 5: MstreamApiProvider.healthcheck()

**Files:**
- Modify: `src/providers/MstreamApiProvider.ts`
- Test: `src/providers/MstreamApiProvider.spec.ts` *(create if absent)*

**Step 1–4:** Two cases — `connected` on 200, `unreachable` on rejection. POST to `{baseUrl}/api/v1/ping`. No auth-failed branch (mstream's current config has no creds).

**Step 5: Commit:** `feat(providers): mstream healthcheck via /api/v1/ping`.

---
## Task 6: ~~YoutubeDlServerProvider.healthcheck()~~ *(dropped)*

`youtube-dl-server` was registered in the settings registry but had no implementing provider class — dead code. Removed in the same commit that closes this task (`src/services/settings/providers.ts`, `src/services/settings/sections.ts`, locale strings). The picker will surface five tiles instead of six.

No implementation; no commit beyond the cleanup. Skip to Task 7.

**Files:**
- Create: `src/stores/livestore/hooks/useProviderHealth.ts`
- Test: `src/stores/livestore/hooks/useProviderHealth.spec.tsx`

**Step 1: Failing tests**

Use `renderHook` from `@testing-library/react`. Cover:
1. Returns `{ status: 'checking', refresh }` synchronously on first render.
2. Calls the provider's `healthcheck()` once on mount and surfaces the resolved status.
3. Returns `{ status: 'disabled' }` and **does not** call `healthcheck()` when the instance config has `enabled: false`.
4. Returns `{ status: 'unknown' }` and does not call `healthcheck()` when the provider implementation lacks the method (mock provider with no `healthcheck`).
5. `refresh()` triggers a second call.
6. Two rapid `refresh()` calls coalesce — `healthcheck()` is called once, not twice (debounce; 200ms is fine).

Mock the provider factory by dependency-injecting it into the hook's signature:

```ts
export type ProviderFactory = (
  providerKey: string,
  config: Record<string, unknown>,
) => { healthcheck?: () => Promise<HealthCheckResult> }
```

**Step 2: Run, confirm red.**

**Step 3: Implement**

The hook signature:

```ts
export const useProviderHealth = (
  providerKey: string,
  config: Record<string, unknown>,
  factory: ProviderFactory,
): { result: HealthCheckResult; refresh: () => void }
```

- Returns `{ status: 'checking', checkedAt: 0 }` until the first probe resolves.
- Returns `{ status: 'disabled', checkedAt: 0 }` immediately when `config.enabled === false`.
- Returns `{ status: 'unknown', checkedAt: 0 }` immediately when the constructed provider has no `healthcheck`.
- `useEffect` keyed on `providerKey + JSON.stringify(config)` runs the probe.
- `refresh()` increments a local counter included in the effect deps.
- Debounce concurrent probes for the same key with a 200ms guard via `useRef<number>(0)` (last call timestamp); if a new call arrives within 200ms of the previous resolution-start, the earlier promise is reused.
- No LiveStore writes — state is local `useState`.

**Step 4: Run, confirm green.**

**Step 5: Commit:** `feat(providers): useProviderHealth hook (session-only)`.

---

## Task 8: StatusDot component

**Files:**
- Create: `src/components/Providers/StatusDot.tsx`
- Test: `src/components/Providers/StatusDot.spec.tsx`

**Step 1: Failing tests**

```tsx
import { render, screen } from '@testing-library/react'
import { StatusDot } from './StatusDot'

describe('StatusDot', () => {
  it.each([
    ['connected', 'Connected'],
    ['checking', 'Checking…'],
    ['unreachable', 'Unreachable'],
    ['authFailed', 'Authentication failed'],
    ['disabled', 'Disabled'],
    ['unknown', 'Status unknown'],
  ] as const)('renders %s with aria-label %s', (status, label) => {
    render(<StatusDot status={status} />)
    expect(screen.getByLabelText(label)).toBeInTheDocument()
  })

  it('renders the checking state with a pulse class', () => {
    const { container } = render(<StatusDot status='checking' />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('renders the disabled state as a hollow ring', () => {
    const { container } = render(<StatusDot status='disabled' />)
    expect(container.firstChild).toHaveClass('ring-1')
  })
})
```

**Step 2: Run, confirm red.**

**Step 3: Implement**

Pure presentational component. Use Tailwind utility classes with `bg-[oklch(...)]` arbitrary values from the design doc's color section. 8px (`h-2 w-2`) dot, `rounded-full`, `inline-block`. `checking` adds `animate-pulse`. `disabled` swaps `bg-*` for `ring-1 ring-[oklch(...)]` and a transparent background.

**Step 4: Run, confirm green.**

**Step 5: Commit:** `feat(providers): StatusDot presentational component`.

---

## Task 9: AddSourceModal (picker)

**Files:**
- Create: `src/components/Providers/AddSourceModal.tsx`
- Test: `src/components/Providers/AddSourceModal.spec.tsx`

**Step 1: Failing tests**

```tsx
describe('AddSourceModal', () => {
  it('renders one tile per registered provider type', () => {
    render(<AddSourceModal isOpen open configuredKeys={[]} onPick={vi.fn()} onClose={vi.fn()} />)
    // Five tiles: subsonic, mstream, itunes, jellyfin, musicbrainz
    expect(screen.getAllByRole('button', { name: /add|connected/i })).toHaveLength(5)
  })

  it('shows capability chips per tile', () => {
    render(<AddSourceModal open configuredKeys={[]} onPick={vi.fn()} onClose={vi.fn()} />)
    const subsonicTile = screen.getByTestId('add-source-tile-subsonic')
    expect(subsonicTile).toHaveTextContent(/sync/i)
    expect(subsonicTile).toHaveTextContent(/search/i)
    expect(subsonicTile).toHaveTextContent(/stream/i)
  })

  it('disables singleton tiles that already have a configured instance', () => {
    render(<AddSourceModal open configuredKeys={['itunes']} onPick={vi.fn()} onClose={vi.fn()} />)
    const itunesTile = screen.getByTestId('add-source-tile-itunes')
    expect(itunesTile).toBeDisabled()
    expect(itunesTile).toHaveTextContent(/connected/i)
  })

  it('still enables repeatable tiles when one is already configured', () => {
    render(<AddSourceModal open configuredKeys={['subsonic']} onPick={vi.fn()} onClose={vi.fn()} />)
    expect(screen.getByTestId('add-source-tile-subsonic')).toBeEnabled()
  })

  it('calls onPick with provider key on tile click and closes', async () => {
    const onPick = vi.fn(); const onClose = vi.fn()
    const { user } = renderWithProviders(
      <AddSourceModal open configuredKeys={[]} onPick={onPick} onClose={onClose} />
    )
    await user.click(screen.getByTestId('add-source-tile-jellyfin'))
    expect(onPick).toHaveBeenCalledWith('jellyfin')
    expect(onClose).toHaveBeenCalled()
  })
})
```

**Step 2: Run, confirm red.**

**Step 3: Implement**

Props:

```ts
type Props = {
  open: boolean
  configuredKeys: string[]   // provider type keys that already have ≥1 instance
  onPick: (providerKey: string) => void
  onClose: () => void
  variant?: 'modal' | 'inline'  // 'inline' for the empty-state full-bleed
}
```

Render a tile grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`). Each tile is a `<button>` with:
- Provider label (`labels.<key>` via `<Translate>`).
- One-line description (new i18n key `providers.descriptions.<key>` — fall back to empty string if missing).
- Capability chips (small uppercase tags).
- Disabled state for singleton + already configured. Disabled tile shows a "Connected" badge instead of the call-to-action.

Variant `modal` wraps in a daisyUI `<dialog className='modal'>` with backdrop close. Variant `inline` renders the grid bare for the empty state.

**Step 4: Run, confirm green.**

**Step 5: Commit:** `feat(providers): AddSourceModal tile picker`.

---

## Task 10: ConnectionCard — collapsed/expanded shell

**Files:**
- Create: `src/components/Providers/ConnectionCard.tsx`
- Test: `src/components/Providers/ConnectionCard.spec.tsx`

This task is the biggest; split into two TDD sub-cycles (10a/10b) but **one commit per sub-cycle**.

### 10a — Visual shell + collapse behavior

**Step 1: Failing tests**

```tsx
describe('ConnectionCard — visual shell', () => {
  const defaultProps = {
    instanceKey: 'subsonic',
    providerKey: 'subsonic',
    schema: /* registry entry for subsonic */,
    config: { enabled: true, baseUrl: 'https://nav.example.com', user: 'u', password: 'p' },
    health: { status: 'connected', checkedAt: Date.now() },
    onSave: vi.fn(), onRemove: vi.fn(), onToggleEnabled: vi.fn(),
    onTestConnection: vi.fn(),
  }

  it('renders the hostname as the card title when no label is set', () => {
    render(<ConnectionCard {...defaultProps} />)
    expect(screen.getByText('nav.example.com')).toBeInTheDocument()
  })

  it('renders the user-supplied name as the title when present', () => {
    render(<ConnectionCard {...defaultProps} config={{ ...defaultProps.config, name: 'Home Navidrome' }} />)
    expect(screen.getByRole('button', { name: /Home Navidrome/ })).toBeInTheDocument()
  })

  it('renders capability chips from the schema', () => {
    render(<ConnectionCard {...defaultProps} />)
    expect(screen.getByText(/sync/i)).toBeInTheDocument()
    expect(screen.getByText(/search/i)).toBeInTheDocument()
    expect(screen.getByText(/stream/i)).toBeInTheDocument()
  })

  it('starts collapsed when health is connected', () => {
    render(<ConnectionCard {...defaultProps} />)
    expect(screen.queryByLabelText(/Server URL/i)).not.toBeInTheDocument()
  })

  it('starts expanded when health is authFailed', () => {
    render(<ConnectionCard {...defaultProps} health={{ status: 'authFailed', error: 'wrong password', checkedAt: 0 }} />)
    expect(screen.getByLabelText(/Server URL/i)).toBeInTheDocument()
    expect(screen.getByText(/wrong password/i)).toBeInTheDocument()
  })

  it('expands on row click', async () => {
    const { user } = renderWithProviders(<ConnectionCard {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /nav\.example\.com/ }))
    expect(screen.getByLabelText(/Server URL/i)).toBeInTheDocument()
  })
})
```

**Step 2:** red. **Step 3:** implement the shell (no form yet — just the header row, capability chips, status dot, enabled toggle, and a conditionally rendered placeholder for the form). **Step 4:** green.

**Step 5: Commit:** `feat(providers): ConnectionCard collapsed/expanded shell`.

### 10b — Form, dirty state, Save/Cancel, enabled autosave

**Step 1: Failing tests**

```tsx
describe('ConnectionCard — form behavior', () => {
  it('shows Save/Cancel only after a field is dirty', async () => {
    const { user } = renderWithProviders(<ConnectionCard {...expandedProps} />)
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
    await user.type(screen.getByLabelText(/Label/i), 'Home')
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onSave with the merged config slice when Save is clicked', async () => {
    const onSave = vi.fn()
    const { user } = renderWithProviders(<ConnectionCard {...expandedProps} onSave={onSave} />)
    await user.type(screen.getByLabelText(/Label/i), 'Home')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith('subsonic', expect.objectContaining({ name: 'Home' }))
  })

  it('Cancel reverts dirty fields to the original config', async () => {
    const { user } = renderWithProviders(<ConnectionCard {...expandedProps} />)
    const labelInput = screen.getByLabelText(/Label/i) as HTMLInputElement
    await user.type(labelInput, 'Home')
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(labelInput.value).toBe('')
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('disables Save until required fields are filled', async () => {
    const { user } = renderWithProviders(<ConnectionCard {...expandedProps} config={{ enabled: true, baseUrl: '', user: '', password: '' }} />)
    await user.type(screen.getByLabelText(/Label/i), 'x')
    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled()
  })

  it('toggling enabled calls onToggleEnabled immediately (autosave)', async () => {
    const onToggleEnabled = vi.fn()
    const { user } = renderWithProviders(<ConnectionCard {...defaultProps} onToggleEnabled={onToggleEnabled} />)
    await user.click(screen.getByRole('switch', { name: /enabled/i }))
    expect(onToggleEnabled).toHaveBeenCalledWith('subsonic', false)
  })

  it('Test connection button calls onTestConnection', async () => {
    const onTestConnection = vi.fn()
    const { user } = renderWithProviders(<ConnectionCard {...expandedProps} onTestConnection={onTestConnection} />)
    await user.click(screen.getByRole('button', { name: /test connection/i }))
    expect(onTestConnection).toHaveBeenCalledWith('subsonic')
  })
})
```

**Step 2:** red.

**Step 3:** Implement using **Formik per card** (matches existing patterns in `ProviderForm.tsx`). The card receives `schema` from the registry and renders fields via the existing `FormSchema` component, but wrapped in its own `<Formik>` instance with `initialValues={{ ...config }}` and `enableReinitialize={false}` (we want dirty state to survive prop refreshes). Save button is `disabled={!isValid || !dirty}`. Cancel calls `resetForm()`.

The `enabled` toggle is **outside** Formik — it's a standalone control in the header row that calls `onToggleEnabled` directly. Do not include `enabled` in the form's `initialValues`.

**Step 4:** green.

**Step 5: Commit:** `feat(providers): ConnectionCard form, Save/Cancel, enabled autosave`.

---

## Task 11: RemoveConnectionDialog

**Files:**
- Create: `src/components/Providers/RemoveConnectionDialog.tsx`
- Test: `src/components/Providers/RemoveConnectionDialog.spec.tsx`

**Step 1: Failing tests**

- Renders the connection name in the body.
- Mentions credentials are deleted.
- Has Cancel (closes without calling onConfirm) and Remove (calls onConfirm and closes).
- ESC closes (calls onClose).
- Remove button is `btn-error` and visually destructive.

**Step 2:** red. **Step 3:** implement with daisyUI's `<dialog>` modal pattern. **Step 4:** green.

**Step 5: Commit:** `feat(providers): RemoveConnectionDialog confirmation modal`.

---

## Task 12: Wire the new page

**Files:**
- Rewrite: `src/components/Providers/index.tsx`
- Delete: `src/components/Providers/ProviderButton.tsx`
- Test: `src/components/Providers/index.spec.tsx` *(new — integration-level)*

**Step 1: Failing tests**

```tsx
describe('Providers page', () => {
  it('shows the empty-state picker when no providers are configured', () => {
    renderWithProviders(<Providers />, { initialState: settingsState({}) })
    expect(screen.getByText(/Connect a music source to get started/i)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /add|connected/i })).toHaveLength(5)
  })

  it('shows a single + Add source button when at least one provider is configured', () => {
    renderWithProviders(<Providers />, {
      initialState: settingsState({ subsonic: { enabled: true, baseUrl: 'https://x', user: 'u', password: 'p' } })
    })
    expect(screen.getByRole('button', { name: /add source/i })).toBeInTheDocument()
  })

  it('opens the AddSourceModal when + Add source is clicked', async () => {
    const { user } = renderWithProviders(<Providers />, { initialState: settingsState({ /* one provider */ }) })
    await user.click(screen.getByRole('button', { name: /add source/i }))
    expect(screen.getByTestId('add-source-tile-jellyfin')).toBeVisible()
  })

  it('adding a provider via the picker appends a card', async () => {
    const { user } = renderWithProviders(<Providers />, { initialState: settingsState({ subsonic: { /* ... */ } }) })
    await user.click(screen.getByRole('button', { name: /add source/i }))
    await user.click(screen.getByTestId('add-source-tile-jellyfin'))
    // The new card is rendered, expanded, with empty fields
    expect(screen.getByLabelText(/Jellyfin.*URL/i)).toBeInTheDocument()
  })
})
```

The `settingsState` helper builds a partial Redux + LiveStore-mocked state. Mock `useSettings` to return `{ providers: <config>, app: {} }` via `vi.mock('../../stores/livestore/hooks', ...)`.

**Step 2:** red.

**Step 3: Implement**

`src/components/Providers/index.tsx` becomes:

```tsx
import { useState, useCallback } from 'react'
import { Translate } from 'react-redux-i18n'
import { useAppStore } from '../../stores/livestore/store'
import { useDispatch } from 'react-redux'
import * as types from '../../constants/ActionTypes'
import { saveSettingsAction, initializeSettingsAction } from '../../stores/livestore/actions/settings'
import { useSettings } from '../../stores/livestore/hooks'
import providerRegistry from '../../services/settings/providers'
import MainContainer from '../common/MainContainer'
import ConnectionCard from './ConnectionCard'
import AddSourceModal from './AddSourceModal'
import RemoveConnectionDialog from './RemoveConnectionDialog'
import { useProviderHealth } from '../../stores/livestore/hooks/useProviderHealth'
import { providerFactory } from './providerFactory'  // small new file: maps providerKey + config → IMusicProvider instance for healthchecks

const Providers = () => {
  const store = useAppStore()
  const dispatch = useDispatch()
  const settings = useSettings()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<string | null>(null)

  if (!settings) return <MainContainer centerContents>Loading settings…</MainContainer>

  const providers = settings.providers ?? {}
  const instanceKeys = Object.keys(providers)
  const isEmpty = instanceKeys.length === 0
  const configuredTypes = Array.from(new Set(instanceKeys.map(k => k.replace(/[0-9]+$/, ''))))

  const saveOne = useCallback(async (instanceKey: string, slice: Record<string, unknown>) => {
    if (!store) return
    await initializeSettingsAction(store)
    const nextProviders = { ...providers, [instanceKey]: { ...providers[instanceKey], ...slice } }
    const result = await saveSettingsAction(store, { ...settings, providers: nextProviders })
    dispatch({ type: types.SETTINGS_SAVED, prevSettings: result.prevSettings, newSettings: result.newSettings })
  }, [store, settings, providers, dispatch])

  const removeOne = useCallback(async (instanceKey: string) => {
    if (!store) return
    const { [instanceKey]: _drop, ...rest } = providers
    const result = await saveSettingsAction(store, { ...settings, providers: rest })
    dispatch({ type: types.SETTINGS_SAVED, prevSettings: result.prevSettings, newSettings: result.newSettings })
  }, [store, settings, providers, dispatch])

  const addOne = useCallback((providerKey: string) => {
    const schema = providerRegistry[providerKey]
    if (!schema) return
    const baseKey = schema.repeatable
      ? nextRepeatableKey(providers, providerKey)
      : providerKey
    const emptyConfig = Object.fromEntries(schema.fields.map(f => [f.key, f.type === 'boolean' ? true : '']))
    void saveOne(baseKey, emptyConfig)
    setPickerOpen(false)
  }, [providers, saveOne])

  if (isEmpty) {
    return (
      <MainContainer centerContents>
        <h1 className='text-2xl'><Translate value="providers.empty.title" /></h1>
        <p className='mt-2 mb-8 opacity-70'><Translate value="providers.empty.subtitle" /></p>
        <AddSourceModal variant='inline' open configuredKeys={[]} onPick={addOne} onClose={() => {}} />
      </MainContainer>
    )
  }

  return (
    <MainContainer>
      <header className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl'><Translate value="providers.title" /></h1>
        <button className='btn btn-primary btn-sm' onClick={() => setPickerOpen(true)}>
          <Translate value="providers.addSource" />
        </button>
      </header>

      <div className='flex flex-col gap-3'>
        {instanceKeys.map(instanceKey => (
          <ConnectionCardConnected
            key={instanceKey}
            instanceKey={instanceKey}
            providerKey={instanceKey.replace(/[0-9]+$/, '')}
            config={providers[instanceKey]}
            onSave={saveOne}
            onRemove={() => setRemoveTarget(instanceKey)}
            onToggleEnabled={(k, enabled) => saveOne(k, { ...providers[k], enabled })}
          />
        ))}
      </div>

      <AddSourceModal
        variant='modal'
        open={pickerOpen}
        configuredKeys={configuredTypes}
        onPick={addOne}
        onClose={() => setPickerOpen(false)}
      />

      {removeTarget && (
        <RemoveConnectionDialog
          instanceKey={removeTarget}
          name={titleFor(providers[removeTarget])}
          onConfirm={async () => { await removeOne(removeTarget); setRemoveTarget(null) }}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </MainContainer>
  )
}
```

`ConnectionCardConnected` is a tiny wrapper that calls `useProviderHealth(providerKey, config, providerFactory)` and passes the result plus a `refresh` handler down to `<ConnectionCard>`. Keep the wrapper inline at the bottom of `index.tsx` if it's <30 lines; otherwise split into `ConnectionCardConnected.tsx`.

`providerFactory` (new file `src/components/Providers/providerFactory.ts`) is a small `Record<string, (config) => IMusicProvider>` mapping. Wire only the four providers that have a `healthcheck` — return `undefined` for `itunes` / `musicbrainz` so the hook returns `unknown`.

**Step 4:** green.

**Step 5: Commit:** `refactor(providers): rewrite page as Connections panel`.

Then a separate commit to remove the dead file:

```bash
git rm src/components/Providers/ProviderButton.tsx
git commit -m "chore(providers): remove obsolete ProviderButton"
```

---

## Task 13: i18n strings

**Files:**
- Modify: `src/locales/en.json`, `src/locales/es.json`, `src/locales/ca.json`

**Step 1:** No test — purely additive locale data.

**Step 2: Add the following keys** (en shown; mirror translations for es/ca, ask the user if uncertain):

```json
"providers": {
  "title": "Sources",
  "addSource": "Add source",
  "empty": {
    "title": "No sources connected yet",
    "subtitle": "Connect a music source to get started."
  },
  "status": {
    "connected": "Connected",
    "checking": "Checking…",
    "unreachable": "Unreachable",
    "authFailed": "Authentication failed",
    "disabled": "Disabled",
    "unknown": "Status unknown"
  },
  "capabilities": { "sync": "Sync", "search": "Search", "stream": "Stream" },
  "descriptions": {
    "subsonic": "Self-hosted music server (Subsonic, Navidrome, Airsonic).",
    "mstream": "Lightweight self-hosted music streaming.",
    "itunes": "Search the public iTunes catalogue.",
    "jellyfin": "Self-hosted media server with a music library.",
    "youtube-dl-server": "Stream from a yt-dlp instance.",
    "musicbrainz": "Open music metadata lookup."
  },
  "testConnection": "Test connection",
  "remove": {
    "menuItem": "Remove…",
    "title": "Remove {name}?",
    "body": "The connection's credentials will be deleted. This cannot be undone.",
    "confirm": "Remove",
    "cancel": "Cancel"
  },
  "labelField": "Label",
  "connectedBadge": "Connected"
}
```

**Step 3:** Run the page tests again — they should pass with real strings instead of `<Translate>` placeholders.

**Step 4: Commit:** `feat(providers): i18n strings for redesigned screen`.

---

## Task 14: Manual smoke check

**Step 1:** Run the dev server: `npm run dev`.

**Step 2:** Walk through these flows by hand:

1. With zero configured sources: see the tile picker as the empty state. Click Jellyfin → card appears expanded, fields empty.
2. Configure a real Subsonic/Navidrome → save → see green dot, collapsed row, hostname title.
3. Change the password to garbage → save → see red dot, auto-expanded card, error inline.
4. Toggle `enabled` off → dot becomes hollow within ~100ms; toggle on → re-probes.
5. Click `+ Add source` → modal opens with itunes/musicbrainz disabled if already configured.
6. Remove a card via overflow menu → confirmation modal → confirm → card disappears.

**Step 3:** Run the full test suite once at the end to confirm no regressions:

`npm test` → all green.

**Step 4: Commit any tweaks discovered:**

```bash
git commit -m "fix(providers): <whatever>" || true
```

---

## Out of scope (do not implement now)

- Persisted health telemetry (uptime history).
- Custom per-provider SVG logos beyond what `Icon` already has.
- Drag-to-reorder. Import/export.

---

## Definition of done

All ten acceptance criteria in [`docs/plans/2026-06-01-providers-redesign-design.md`](./2026-06-01-providers-redesign-design.md#acceptance-criteria) hold true when the dev server runs against a real Navidrome / Jellyfin instance. The full Vitest suite passes. No new repo-wide lint regressions (touched files lint clean).
