import indexeddb from 'fake-indexeddb'
import { vi } from 'vitest'

globalThis.indexedDB = indexeddb

const Mock = vi.fn()
vi.stubGlobal('IntersectionObserver', Mock)

