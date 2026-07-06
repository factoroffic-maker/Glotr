// Vitest global setup — přidává jest-dom matchery (toBeInTheDocument, …)
// a automatický cleanup po každém testu.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
