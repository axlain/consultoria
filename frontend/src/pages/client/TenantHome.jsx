import { useTenant } from '../../context/TenantContext'
import { TenantSeo } from '../../components/TenantSeo'
import { StickyCta } from '../../components/StickyCta'
import { HamburgerMenu } from '../../components/HamburgerMenu'
import { ClientShell } from '../../components/ClientShell'

export function TenantHome() {
  const { tenant } = useTenant()
  const { google_rating, google_review_count, google_reviews_url } = tenant.business

  return (
    <ClientShell reserveCta>
      <TenantSeo tenant={tenant} />

      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      <header className="motion-safe:animate-fade-in mb-10 text-center">
        <img
          src={tenant.theme.logo_url}
          alt={tenant.business.name}
          className="mx-auto mb-3 h-14"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <h1>{tenant.business.name}</h1>
        <p className="text-muted mt-1.5">{tenant.business.address}</p>

        {google_rating && (
          <div className="border-secondary/30 bg-secondary/10 mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm">
            <span className="text-secondary" aria-hidden="true">
              {'★'.repeat(Math.round(google_rating))}
            </span>
            <span className="font-semibold">{google_rating}</span>
            <span className="text-muted">· {google_review_count} reseñas en Google</span>
          </div>
        )}
      </header>

      <section aria-labelledby="services-heading" className="mt-10">
        <h2 id="services-heading">Servicios</h2>
        <ul className="flex list-none flex-col gap-2.5 p-0 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {tenant.services.map((service) => (
            <li
              key={service.id}
              className="border-line flex items-center justify-between gap-3 rounded-xl border border-l-4 bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] md:items-center"
              style={{ borderLeftColor: service.color }}
            >
              <span className="font-medium">{service.name}</span>
              <span className="text-muted whitespace-nowrap text-sm tabular-nums">
                {service.duration_minutes} min · ${service.price}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reviews-heading" className="mt-10">
        <h2 id="reviews-heading">Reseñas en Google</h2>
        <ul className="flex list-none flex-col gap-2.5 p-0 md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {tenant.reviews.map((review, i) => (
            <li
              key={`${review.author}-${i}`}
              className="border-line rounded-xl border bg-white px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <p className="mb-2 text-[0.95rem] leading-snug">&ldquo;{review.comment}&rdquo;</p>
              <p className="text-muted text-sm">
                <span className="font-semibold text-inherit">{review.author}</span> ·{' '}
                {'★'.repeat(review.rating)}
              </p>
            </li>
          ))}
        </ul>
        {google_reviews_url && (
          <a
            href={google_reviews_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold"
          >
            Ver todas las reseñas en Google Maps →
          </a>
        )}
      </section>

      <section aria-labelledby="map-heading" className="mt-10">
        <h2 id="map-heading">Cómo llegar</h2>
        <iframe
          title={`Mapa de ${tenant.business.name}`}
          src={tenant.business.map_embed_url}
          className="border-line h-[220px] w-full rounded-xl border"
          loading="lazy"
        />
        <a href={`tel:${tenant.business.phone}`} className="mt-3 inline-block font-semibold">
          {tenant.business.phone}
        </a>
      </section>

      <footer className="border-line text-muted mt-10 border-t pt-5 text-sm">
        <a href={tenant.privacy_policy_url} className="text-muted">
          Política de privacidad
        </a>
      </footer>

      <StickyCta slug={tenant.slug} />
    </ClientShell>
  )
}
