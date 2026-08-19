import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Without vitest's `globals: true`, @testing-library/react can't auto-detect
// `afterEach` to unmount components between tests — wire it up explicitly.
afterEach(cleanup)
