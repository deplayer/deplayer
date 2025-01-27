/// <reference types="vitest" />
/// <reference types="@testing-library/jest-dom" />
import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'
import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers) 