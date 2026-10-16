import { Form, Spinner } from 'react-bootstrap'
import { Highlighter, Typeahead } from 'react-bootstrap-typeahead'
import { TCGS } from '@/constants/tcgs'
import { useTcgSets } from '@/hooks/useTcgSets'
import type { TcgSet } from '@/types'
import type { ConfigErrors } from './configForm'
import { describedBy } from './describedBy'

interface TcgSetFieldsProps {
  tcg: number | null
  set: TcgSet | null
  errors: ConfigErrors
  onTcgChange: (tcg: number | null) => void
  onSetChange: (set: TcgSet | null) => void
  onSetBlur: () => void
}

const releaseYear = (set: TcgSet) => set.releaseDate?.slice(0, 4)

const TcgSetFields = ({
  tcg,
  set,
  errors,
  onTcgChange,
  onSetChange,
  onSetBlur,
}: TcgSetFieldsProps) => {
  const sets = useTcgSets(tcg)
  const options = sets.data ?? []

  return (
    <>
      <Form.Group className="mb-3" controlId="tcg-select">
        <Form.Label>TCG</Form.Label>
        <Form.Select
          value={tcg ?? ''}
          isInvalid={Boolean(errors.tcg)}
          aria-invalid={Boolean(errors.tcg)}
          aria-describedby={describedBy(errors.tcg && 'tcg-error')}
          onChange={(event) => onTcgChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="" disabled>
            Selecciona un TCG
          </option>
          {TCGS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Form.Select>
        <Form.Control.Feedback type="invalid" id="tcg-error">
          {errors.tcg}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="set-input" className="d-flex align-items-center gap-2">
          Set
          {sets.loading && (
            <Spinner animation="border" size="sm" role="status" aria-label="Cargando sets" />
          )}
        </Form.Label>
        <Typeahead
          id="set-selector"
          inputProps={{
            id: 'set-input',
            'aria-invalid': Boolean(errors.set),
            'aria-describedby': describedBy(
              errors.set && 'set-error',
              sets.error && 'set-load-error',
            ),
          }}
          labelKey="name"
          options={options}
          selected={set ? [set] : []}
          placeholder={tcg === null ? 'Primero selecciona un TCG' : 'Busca o selecciona un set'}
          emptyLabel="No se encontraron sets."
          paginationText="Mostrar más resultados…"
          disabled={tcg === null || sets.loading || Boolean(sets.error)}
          isInvalid={Boolean(errors.set)}
          onChange={(selected) => onSetChange((selected[0] as TcgSet | undefined) ?? null)}
          onBlur={onSetBlur}
          renderMenuItemChildren={(option, { text }) => {
            const item = option as TcgSet
            return (
              <div className="d-flex justify-content-between gap-2">
                <Highlighter search={text}>{item.name}</Highlighter>
                <small className="text-body-secondary">{releaseYear(item)}</small>
              </div>
            )
          }}
        />
        {errors.set && (
          <div id="set-error" className="invalid-feedback d-block">
            {errors.set}
          </div>
        )}
        {sets.error && (
          <div id="set-load-error" className="invalid-feedback d-block">
            No se pudieron cargar los sets: {sets.error.message}
          </div>
        )}
      </Form.Group>
    </>
  )
}

export default TcgSetFields
