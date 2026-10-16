import 'bootstrap/dist/css/bootstrap.min.css'
import { Link } from 'react-router'

const NotFound = () => (
  <main
    data-bs-theme="dark"
    className="bg-body text-body min-vh-100 d-flex flex-column justify-content-center align-items-center gap-2 p-4 text-center"
  >
    <h1 className="titan-text display-3 mb-0">404</h1>
    <p className="titan-text fs-4">Página no encontrada 🥹</p>
    <Link to="/" className="btn btn-primary">
      Ir a la configuración del widget
    </Link>
  </main>
)

export default NotFound
