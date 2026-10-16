import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TcgSet } from '@/types'
import ConfigPage from './ConfigPage'
import { saveFormState } from './configForm'
import { DEFAULT_WIDGET_CONFIG } from '@/lib/widgetConfig'
import { installFakeTextLayout } from '@/test/fakeTextLayout'

const pokemonSets: TcgSet[] = [
  {
    setNameId: 23651,
    categoryId: 3,
    name: 'SV08: Surging Sparks',
    abbreviation: 'SSP',
    releaseDate: '2024-11-08T00:00:00',
    isSupplemental: false,
  },
  {
    setNameId: 604,
    categoryId: 3,
    name: 'Base Set',
    abbreviation: 'BS',
    releaseDate: '1999-01-09T00:00:00',
    isSupplemental: false,
  },
]

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  localStorage.clear()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => Response.json(pokemonSets))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const linkInput = () => screen.getByLabelText<HTMLInputElement>('Link del widget')
const copyButton = () => screen.getByRole('button', { name: /copiar/i })
const setInput = () => screen.getByLabelText<HTMLInputElement>(/^Set/)

const chooseSet = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await waitFor(() => expect(setInput()).toBeEnabled())
  await user.type(setInput(), name)
  const option = (await screen.findAllByRole('option')).find((item) =>
    item.textContent?.startsWith(name),
  )
  await user.click(option!)
}

const setupValidForm = async () => {
  const user = userEvent.setup()
  render(<ConfigPage />)
  await user.selectOptions(screen.getByLabelText('TCG'), '3')
  await chooseSet(user, 'Base Set')
  return user
}

describe('ConfigPage', () => {
  it('no permite copiar el link sin TCG ni set', () => {
    render(<ConfigPage />)

    expect(linkInput()).toHaveValue('')
    expect(copyButton()).toBeDisabled()
    expect(setInput()).toBeDisabled()
    expect(screen.getByText('Selecciona un TCG.')).toBeInTheDocument()
  })

  it('carga los sets del TCG elegido y genera el link', async () => {
    await setupValidForm()

    expect(fetchMock).toHaveBeenCalledWith('/api/tcg-sets?tcg=3', expect.anything())
    expect(linkInput().value).toBe(`${window.location.origin}/widget?setId=604&tcg=3`)
    expect(copyButton()).toBeEnabled()
  })

  it('copia el link al portapapeles', async () => {
    const user = await setupValidForm()

    await user.click(copyButton())

    expect(await screen.findByRole('button', { name: '¡Copiado!' })).toBeInTheDocument()
    await expect(navigator.clipboard.readText()).resolves.toBe(linkInput().value)
  })

  it('refleja los parámetros en el link', async () => {
    const user = await setupValidForm()

    await user.click(screen.getByLabelText('Mostrar precio'))
    await user.click(screen.getByLabelText('Mostrar nombre de la carta'))
    await user.selectOptions(screen.getByLabelText('Animación'), 'fade')
    await user.click(screen.getByLabelText('Texto oscuro'))

    const params = new URL(linkInput().value).searchParams
    expect(Object.fromEntries(params)).toMatchObject({
      showPrice: '0',
      showName: '1',
      animation: 'fade',
      textColor: 'black',
    })
  })

  it('resetea el set al cambiar de TCG', async () => {
    const user = await setupValidForm()

    await user.selectOptions(screen.getByLabelText('TCG'), '2')

    expect(setInput()).toHaveValue('')
    expect(linkInput()).toHaveValue('')
  })

  it('valida la cantidad de cartas en línea', async () => {
    const user = await setupValidForm()
    const total = screen.getByLabelText('Cantidad de cartas')

    await user.clear(total)
    await user.type(total, '20')

    expect(total).toBeInvalid()
    expect(screen.getAllByText('La cantidad de cartas debe estar entre 5 y 15.')).not.toHaveLength(
      0,
    )
    expect(copyButton()).toBeDisabled()
  })

  it('muestra la vista previa cuando la configuración es válida', async () => {
    await setupValidForm()

    const frame = await screen.findByTitle('Vista previa del widget')
    expect(frame).toHaveAttribute('src', linkInput().value)
  })

  it('restaura la última configuración guardada', async () => {
    saveFormState({
      settings: { ...DEFAULT_WIDGET_CONFIG, tcg: 3, total: 8 },
      set: pokemonSets[0]!,
    })

    render(<ConfigPage />)

    expect(linkInput().value).toBe(`${window.location.origin}/widget?setId=23651&tcg=3&total=8`)
    await waitFor(() => expect(setInput()).toHaveValue('SV08: Surging Sparks'))
  })

  it('muestra el error si no se pueden cargar los sets', async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ message: 'TCGplayer no respondió a tiempo.', status: 504 }, { status: 504 }),
    )
    const user = userEvent.setup()
    render(<ConfigPage />)

    await user.selectOptions(screen.getByLabelText('TCG'), '3')

    expect(
      await screen.findByText('No se pudieron cargar los sets: TCGplayer no respondió a tiempo.'),
    ).toBeInTheDocument()
  })
})

describe('ConfigPage: parámetros', () => {
  const linkParams = () => Object.fromEntries(new URL(linkInput().value).searchParams)

  it('ajusta tiempo por carta, refresco y ancho de carta', async () => {
    const user = await setupValidForm()

    fireEvent.change(screen.getByLabelText(/Tiempo por carta/), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Ancho de la carta/), { target: { value: '250' } })
    await user.selectOptions(screen.getByLabelText('Actualizar precios'), '0')

    expect(screen.getByLabelText(/Tiempo por carta/)).toHaveAccessibleName('Tiempo por carta: 10 s')
    expect(linkParams()).toMatchObject({ duration: '10', cardWidth: '250', refresh: '0' })
  })

  it('usa un color de texto personalizado', async () => {
    const user = await setupValidForm()
    const colorInput = screen.getByLabelText('Color personalizado')
    expect(colorInput).toBeDisabled()

    await user.click(screen.getByLabelText('Personalizado'))
    expect(linkParams().textColor).toBe('#ffcc00')

    fireEvent.change(colorInput, { target: { value: '#00FF00' } })
    expect(linkParams().textColor).toBe('#00ff00')

    await user.click(screen.getByLabelText('Texto claro'))
    expect(linkParams().textColor).toBeUndefined()
    expect(colorInput).toBeDisabled()
  })

  it('valida y aplica el texto del título', async () => {
    const user = await setupValidForm()
    const title = screen.getByLabelText('Texto del título')

    await user.clear(title)
    expect(title).toBeInvalid()
    expect(copyButton()).toBeDisabled()

    await user.type(title, 'Top {{set}')
    expect(linkParams().title).toBe('Top {set}')

    await user.click(screen.getByLabelText('Mostrar título'))
    expect(title).toBeDisabled()
    expect(linkParams().showTitle).toBe('0')
  })

  it('deshabilita la moneda si no se muestra el precio', async () => {
    const user = await setupValidForm()
    const currency = screen.getByLabelText('Moneda')

    await user.click(screen.getByLabelText('Mostrar precio'))

    expect(currency).toBeDisabled()
  })

  it('marca el set como pendiente al salir del buscador sin elegir', async () => {
    const user = userEvent.setup()
    render(<ConfigPage />)
    await user.selectOptions(screen.getByLabelText('TCG'), '3')
    await waitFor(() => expect(setInput()).toBeEnabled())

    expect(screen.getAllByText('Selecciona un set.')).toHaveLength(1)
    await user.click(setInput())
    await user.tab()

    expect(screen.getAllByText('Selecciona un set.')).toHaveLength(2)
  })

  it('avisa si no se puede copiar al portapapeles', async () => {
    const user = await setupValidForm()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denegado'))

    await user.click(copyButton())

    expect(await screen.findByText(/No se pudo copiar automáticamente/)).toBeInTheDocument()
  })

  it('cambia el fondo de la vista previa', async () => {
    const user = await setupValidForm()

    await user.click(screen.getByLabelText('Transparente'))

    expect(document.querySelector('.widget-preview')).toHaveClass('widget-preview--checker')
  })
})

describe('ConfigPage: aviso de título largo', () => {
  const longSet: TcgSet = {
    setNameId: 5171,
    categoryId: 2,
    name: "Pharaoh's Servant (25th Anniversary Edition)",
    abbreviation: 'PSV-EN',
    releaseDate: '2023-06-23T00:00:00',
    isSupplemental: false,
  }

  const hint = () => screen.queryByText(/el título se verá en letra pequeña/)

  beforeEach(() => {
    installFakeTextLayout()
    fetchMock.mockImplementation(async () => Response.json([longSet]))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const setupLongTitle = async () => {
    const user = userEvent.setup()
    render(<ConfigPage />)
    await user.selectOptions(screen.getByLabelText('TCG'), '2')
    await chooseSet(user, "Pharaoh's Servant")
    return user
  }

  it('avisa si el título queda en letra pequeña con el ancho elegido', async () => {
    await setupLongTitle()

    expect(hint()).toHaveTextContent('(14 px)')
    expect(screen.getByLabelText('Texto del título')).toHaveAccessibleDescription(
      /letra pequeña \(14 px\)/,
    )
  })

  it('quita el aviso al aumentar el ancho de la carta', async () => {
    await setupLongTitle()

    fireEvent.change(screen.getByLabelText(/Ancho de la carta/), { target: { value: '400' } })

    expect(hint()).not.toBeInTheDocument()
  })

  it('quita el aviso al usar {code}', async () => {
    const user = await setupLongTitle()
    const title = screen.getByLabelText('Texto del título')

    await user.clear(title)
    await user.type(title, 'Top hits {{code}')

    expect(hint()).not.toBeInTheDocument()
  })

  it('no avisa si el título está oculto', async () => {
    const user = await setupLongTitle()

    await user.click(screen.getByLabelText('Mostrar título'))

    expect(hint()).not.toBeInTheDocument()
  })
})
