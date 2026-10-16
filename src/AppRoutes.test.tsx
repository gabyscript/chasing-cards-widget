import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import AppRoutes from './AppRoutes'

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
    vi.fn(async () => Response.json([])),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AppRoutes', () => {
  it('muestra la configuración en /', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Chasing Cards Widget' }, LAZY_PAGE_TIMEOUT),
    ).toBeInTheDocument()
  })

  it('muestra el widget en /widget', () => {
    renderAt('/widget')
    expect(screen.getByText(/Link de widget inválido/)).toBeInTheDocument()
  })

  it('muestra 404 en rutas desconocidas y permite volver a la configuración', async () => {
    const user = userEvent.setup()
    renderAt('/chasing-cards/widget')

    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Página no encontrada 🥹')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Ir a la configuración del widget' }))

    expect(
      await screen.findByRole('heading', { name: 'Chasing Cards Widget' }, LAZY_PAGE_TIMEOUT),
    ).toBeInTheDocument()
  })
})
