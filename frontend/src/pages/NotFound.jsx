import { Link, useParams } from 'react-router-dom'

// RF07: custom 404 that returns the visitor to the correct tenant's home.
export function NotFound() {
  const { slug } = useParams()

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl">404</h1>
      <p className="text-muted mt-3">La página que buscas no existe.</p>
      {slug && (
        <Link
          to={`/demo/${slug}`}
          className="border-line hover:border-accent mt-6 inline-block rounded-full border px-5 py-2.5 text-sm font-semibold no-underline"
        >
          Volver al inicio
        </Link>
      )}
    </div>
  )
}
