// Smoke test PR-01 — ověřuje, že testovací infrastruktura funguje:
// Vitest běží, jsdom je aktivní, React Testing Library renderuje a jest-dom
// matchery jsou k dispozici. Neváže se na aplikační kód (ten se testuje v dalších PR).
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hello({ name }) {
  return <p>Ahoj, {name}!</p>
}

describe('test infrastructure (PR-01)', () => {
  it('Vitest spouští testy', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom + React Testing Library + jest-dom fungují', () => {
    render(<Hello name="Glotr" />)
    expect(screen.getByText('Ahoj, Glotr!')).toBeInTheDocument()
  })
})
