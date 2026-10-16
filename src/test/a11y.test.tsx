import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router'
import AppRoutes from '@/AppRoutes'
import { makeCard, makeResponse } from '@/test/fixtures'

const runAxe = async (container: HTMLElement) => {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  })
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`)
}

const LAZY_PAGE_TIMEOUT = { timeout: 5000 }

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )

beforeEach(() => {
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) =>
      String(url).includes('tcg-sets')
        ? Response.json([
            {
              setNameId: 604,
              categoryId: 3,
              name: 'Base Set',
              abbreviation: 'BS',
              releaseDate: '1999-01-09T00:00:00',
              isSupplemental: false,
            },
          ])
        : Response.json(makeResponse([makeCard(1), makeCard(2)])),
    ),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('accesibilidad (axe)', () => {
  it('pantalla de configuración vacía', async () => {
    const { container } = renderAt('/')
    await screen.findByRole('heading', { name: 'Chasing Cards Widget' }, LAZY_PAGE_TIMEOUT)
    expect(await runAxe(container)).toEqual([])
  })

  it('pantalla de configuración con errores visibles', async () => {
    const user = userEvent.setup()
    const { container } = renderAt('/')
    await screen.findByRole('heading', { name: 'Chasing Cards Widget' }, LAZY_PAGE_TIMEOUT)
    await user.selectOptions(screen.getByLabelText('TCG'), '3')
    await waitFor(() => expect(screen.getByLabelText(/^Set/)).toBeEnabled())
    await user.click(screen.getByLabelText(/^Set/))
    await user.tab()
    await user.clear(screen.getByLabelText('Texto del título'))

    expect(screen.getByLabelText('Texto del título')).toHaveAccessibleDescription(
      /El título no puede quedar vacío/,
    )
    expect(await runAxe(container)).toEqual([])
  })

  it('widget con cartas', async () => {
    const { container } = renderAt('/widget?setId=604&showName=1')
    await act(async () => {})
    await screen.findByRole('img', { name: 'Carta 1' })

    expect(await runAxe(container)).toEqual([])
  })

  it('página 404', async () => {
    const { container } = renderAt('/no-existe')
    await screen.findByRole('heading', { name: '404' })
    expect(await runAxe(container)).toEqual([])
  })
})
