import { useTenant } from '../../context/TenantContext'
import { TenantSeo } from '../../components/TenantSeo'
import { StickyCta } from '../../components/StickyCta'
import { HamburgerMenu } from '../../components/HamburgerMenu'

export function TenantHome() {
  const { tenant } = useTenant()
  const { google_rating, google_review_count, google_reviews_url } = tenant.business

  return (
    <div className="client-shell">
      <TenantSeo tenant={tenant} />

      <HamburgerMenu faqs={tenant.faqs} />

      <header className="hero">
        <img src={tenant.theme.logo_url} alt={tenant.business.name} className="hero-logo" />
        <h1>{tenant.business.name}</h1>
        <p>{tenant.business.address}</p>
      </header>

      <section aria-labelledby="services-heading">
        <h2 id="services-heading">Servicios</h2>
        <ul className="service-list">
          {tenant.services.map((service) => (
            <li key={service.id} className="service-card">
              <span className="service-name">{service.name}</span>
              <span className="service-meta">
                {service.duration_minutes} min · ${service.price}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">Reseñas en Google</h2>
        {google_rating && (
          <p className="reviews-summary">
            {'★'.repeat(Math.round(google_rating))}
            <strong> {google_rating}</strong> · {google_review_count} reseñas en Google Maps
          </p>
        )}
        <ul className="review-list">
          {tenant.reviews.map((review, i) => (
            <li key={`${review.author}-${i}`} className="review-card">
              <strong>{review.author}</strong> — {'★'.repeat(review.rating)}
              <p>{review.comment}</p>
            </li>
          ))}
        </ul>
        {google_reviews_url && (
          <a href={google_reviews_url} target="_blank" rel="noopener noreferrer" className="google-reviews-link">
            Ver todas las reseñas en Google Maps
          </a>
        )}
      </section>

      <section aria-labelledby="map-heading">
        <h2 id="map-heading">Cómo llegar</h2>
        <iframe
          title={`Mapa de ${tenant.business.name}`}
          src={tenant.business.map_embed_url}
          className="map-embed"
          loading="lazy"
        />
        <p>{tenant.business.phone}</p>
      </section>

      <footer>
        <a href={tenant.privacy_policy_url}>Política de privacidad</a>
      </footer>

      <StickyCta slug={tenant.slug} />
    </div>
  )
}
