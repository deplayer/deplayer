/// <reference types="vitest" />
/**
 * Store-field reachability check.
 *
 * Catches the failure mode that broke `useUIStore.ready` in Stage 2: a field
 * has readers in component code but no writer anywhere, so it sits at its
 * initial value forever and any UI gating on it silently breaks.
 *
 * Algorithm:
 *   - Parse the UIState type in src/stores/uiStore.ts. Every field is a
 *     potential reader target via `useUIStore((s) => s.X)` (or destructuring).
 *   - Walk src/ (excluding test files) for `s.X` reads through useUIStore.
 *   - Walk src/stores/uiStore.ts for writers: any `set({ X: ... })`,
 *     `set((s) => ({ X: ... }))`, or `useUIStore.setState({ X: ... })`.
 *   - For each field with at least one reader, require at least one writer.
 *
 * Regex-based instead of AST-based on purpose: this is a tripwire, not a
 * compiler. False positives are easy to whitelist; false negatives (a
 * dead-field read in prod) are the bug we're trying to catch.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = join(__dirname, '..', '..')
const srcRoot = join(repoRoot, 'src')
const uiStorePath = join(srcRoot, 'stores', 'uiStore.ts')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      out.push(...walk(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.spec\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function parseStateFields(src: string): string[] {
  // Match the `type UIState = { ... }` block and extract `name:` keys.
  const match = src.match(/type\s+UIState\s*=\s*{([\s\S]*?)\n}/)
  if (!match) throw new Error('Could not locate UIState type block in uiStore.ts')
  const body = match[1]
  const fields: string[] = []
  for (const line of body.split('\n')) {
    const m = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[?]?\s*:/)
    if (m) fields.push(m[1])
  }
  return fields
}

function findReaders(field: string, files: string[]): string[] {
  // Catch: useUIStore((s) => s.field), useUIStore((s) => s.field?.x),
  // and destructured `s.field` references anywhere a selector is in scope.
  const re = new RegExp(`\\bs\\.${field}\\b`)
  return files.filter((f) => f !== uiStorePath && re.test(readFileSync(f, 'utf8')))
}

function findWriters(field: string, storeSrc: string): boolean {
  // Writers in this store live inside set(...) calls. Match both forms:
  //   set({ field: value })  / set((s) => ({ field: value }))
  //   set({ field })         / set((s) => ({ field }))   (shorthand)
  // The shorthand requires that `field` appear inside `{...}` not followed
  // by another identifier-character (i.e. terminated by `,` or `}`).
  const explicit = new RegExp(`set\\s*\\(\\s*(?:\\([^)]*\\)\\s*=>\\s*)?\\(?\\s*{[^}]*\\b${field}\\s*:`)
  const shorthand = new RegExp(`set\\s*\\(\\s*(?:\\([^)]*\\)\\s*=>\\s*)?\\(?\\s*{[^}]*\\b${field}\\s*[,}]`)
  return explicit.test(storeSrc) || shorthand.test(storeSrc)
}

describe('useUIStore field reachability', () => {
  const storeSrc = readFileSync(uiStorePath, 'utf8')
  const fields = parseStateFields(storeSrc)
  const files = walk(srcRoot)

  it('every read field has at least one writer', () => {
    const orphans: Array<{ field: string; readers: string[] }> = []
    for (const field of fields) {
      const readers = findReaders(field, files)
      if (readers.length === 0) continue // dead field, separate concern
      if (!findWriters(field, storeSrc)) {
        orphans.push({
          field,
          readers: readers.map((p) => relative(repoRoot, p)).slice(0, 5),
        })
      }
    }
    expect(orphans, `useUIStore fields with readers but no writer: ${JSON.stringify(orphans, null, 2)}`).toEqual([])
  })

  it('exposes at least 10 fields (sanity guard that parsing works)', () => {
    expect(fields.length).toBeGreaterThan(10)
  })
})
