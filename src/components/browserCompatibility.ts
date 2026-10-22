export interface BrowserRequirement {
  name: string
  check: () => boolean
  description: string
}

const BROWSER_REQUIREMENTS: BrowserRequirement[] = [
  {
    name: 'Web Locks API',
    check: () => typeof navigator !== 'undefined' && 'locks' in navigator,
    description: 'Required for coordinating data access across browser tabs',
  },
  {
    name: 'Web Crypto API',
    check: () => typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function',
    description: 'Required for generating unique identifiers',
  },
  {
 name: 'SharedWorker',
 check: () => typeof SharedWorker !== 'undefined' || typeof Worker !== 'undefined',
 description: 'Required for background data synchronization',
 },
  {
    name: 'Origin Private File System',
    check: () => typeof navigator !== 'undefined' && 'storage' in navigator,
    description: 'Required for persistent local storage',
  },
]

export const checkBrowserCompatibility = (): { supported: boolean; missing: BrowserRequirement[] } => {
  const missing = BROWSER_REQUIREMENTS.filter((req) => !req.check())
  return {
    supported: missing.length === 0,
    missing,
  }
}
