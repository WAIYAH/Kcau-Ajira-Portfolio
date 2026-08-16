import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Without `globals: true` in vite.config.ts, @testing-library/react can't
// auto-detect a global `afterEach` to register its own cleanup, so each
// render() would otherwise pile up in document.body across tests in the
// same file.
afterEach(cleanup)
