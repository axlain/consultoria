import { Link } from 'react-router-dom'

// Dev convenience entry point listing the seeded demo tenants.
export function Home() {
  return (
    <div className="page">
      <h1>Demos disponibles</h1>
      <ul>
        <li>
          <Link to="/demo/barberia">Barbería El Corte</Link>
        </li>
        <li>
          <Link to="/demo/tattoo">Ink Studio</Link>
        </li>
      </ul>
    </div>
  )
}
