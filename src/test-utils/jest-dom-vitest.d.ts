import 'vitest'
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// Vitest 5 no longer folds the global `jest.Matchers` (which
// '@testing-library/jest-dom' augments) into its Assertion type, and
// jest-dom's own 'vitest' typings still augment the pre-v5 `Assertion<T>`
// signature. Register the matchers on Vitest 5's `Matchers` extension point.
declare module 'vitest' {
  // `T` is unused but must match Vitest's declaration for interface merging.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown>
    // Vitest types asymmetric matchers (expect.stringContaining etc.) as `any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extends TestingLibraryMatchers<any, R> {}
}
