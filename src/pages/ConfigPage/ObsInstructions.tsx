interface ObsInstructionsProps {
  size: { width: number; height: number }
}

const ObsInstructions = ({ size }: ObsInstructionsProps) => (
  <div>
    <h2 className="h6">Cómo agregarlo a OBS</h2>
    <ol className="small mb-0 ps-3">
      <li>Copia el link del widget.</li>
      <li>
        En OBS, agrega una fuente <strong>Navegador</strong> y pega el link en <em>URL</em>.
      </li>
      <li>
        Usa un tamaño de{' '}
        <strong>
          {size.width} × {size.height} px
        </strong>{' '}
        (ancho × alto).
      </li>
      <li>El fondo es transparente: no necesitas CSS personalizado.</li>
      <li>Si cambias la configuración, vuelve a copiar el link y reemplázalo en la fuente.</li>
    </ol>
  </div>
)

export default ObsInstructions
