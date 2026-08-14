import { Link, useParams } from 'react-router-dom'

// RF07: custom 404 that returns the visitor to the correct tenant's home.
export function NotFound() {
  const { slug } = useParams()

  return (
    <div className="page not-found">
      <h1>Página no encontrada</h1>
      <p>La página que buscas no existe.</p>
      {slug && <Link to={`/demo/${slug}`}>Volver al inicio</Link>}
    </div>
  )
}
