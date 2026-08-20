import { useEffect } from "react";
import { servicePhoto, professionalPhoto } from "../../utils/fallbackImages";
import { Link, useLocation } from "react-router-dom";
import { useTenant } from "../../context/TenantContext";
import { useAuth } from "../../context/AuthContext";
import { TenantSeo } from "../../components/TenantSeo";
import { StickyCta } from "../../components/StickyCta";
import { HamburgerMenu } from "../../components/HamburgerMenu";
import { ClientShell } from "../../components/ClientShell";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop&auto=format";

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function TenantHome() {
  const { tenant } = useTenant();
  const { user } = useAuth();
  const location = useLocation();
  const { google_rating, google_review_count, google_reviews_url } = tenant.business;
  const firstName =
    user?.role === "client" ? (user.name || "").trim().split(/\s+/)[0] : null;

  const coverImage =
    tenant.theme?.cover_image_url ||
    tenant.business?.cover_image_url ||
    FALLBACK_COVER;

  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);

  return (
    <ClientShell reserveCta wide>
      <TenantSeo tenant={tenant} />
      <HamburgerMenu faqs={tenant.faqs} slug={tenant.slug} />

      {/* ── Top bar (desktop) ────────────────────────────────────── */}
      <div className="hidden lg:flex lg:max-w-6xl lg:mx-auto lg:items-center lg:justify-between lg:pl-12 lg:pr-20 lg:pt-8">
        {tenant.theme?.logo_url ? (
          <img
            src={tenant.theme.logo_url}
            alt={tenant.business.name}
            className="h-9 w-9 rounded-full object-cover border border-accent/40"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-[#0C0B09]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
              <line x1="20" y1="4" x2="8.12" y2="15.88" />
              <line x1="14.47" y1="14.48" x2="20" y2="20" />
              <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
          </div>
        )}
        <a href={`tel:${tenant.business.phone}`} className="flex items-center gap-2 text-ink/70 hover:text-accent transition-colors no-underline text-sm font-medium">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12.9 19.79 19.79 0 0 1 1.15 4.27 2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
          </svg>
          {tenant.business.phone}
        </a>
      </div>

      {/* ── Hero (desktop) ───────────────────────────────────────── */}
      <div className="hidden lg:flex lg:max-w-6xl lg:mx-auto lg:items-center lg:gap-14 lg:px-12 lg:py-16">
        <div className="flex-1 max-w-lg">
          <span className="inline-flex items-center gap-1.5 bg-accent/20 text-accent text-xs font-semibold px-2.5 py-1 rounded-full border border-accent/30 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
            Abierto ahora
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight mb-3 text-ink">
            {tenant.business.name.includes(" ")
              ? <>
                  {tenant.business.name.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="text-accent">{tenant.business.name.split(" ").slice(-1)[0]}</span>
                </>
              : <span className="text-accent">{tenant.business.name}</span>
            }
          </h1>
          <p className="text-ink/60 text-base mb-6 flex items-center gap-2">
            <MapPinIcon /> {tenant.business.address}
          </p>
          <Link
            to={`/demo/${tenant.slug}/reservar`}
            className="inline-block rounded-2xl bg-accent px-8 py-4 text-center font-bold text-base text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            Reservar ahora
          </Link>

          {google_rating && (
            <div className="grid grid-cols-3 gap-4 mt-10 pt-6 border-t border-line">
              {[
                { val: `${google_rating}★`, label: "Calificación" },
                { val: google_review_count ? `${google_review_count >= 1000 ? (google_review_count/1000).toFixed(1)+'k' : google_review_count}` : "—", label: "Reseñas" },
                { val: "Premium", label: "Servicio" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col">
                  <span className="text-lg font-bold text-accent">{s.val}</span>
                  <span className="text-[10px] text-muted mt-0.5 uppercase tracking-wider font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 h-[440px] rounded-3xl overflow-hidden border border-line">
          <img
            src={coverImage}
            alt={tenant.business.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
          />
        </div>
      </div>

      {/* ── Hero (mobile) ────────────────────────────────────────── */}
      <div className="relative h-[500px] overflow-hidden lg:hidden">
        <img
          src={coverImage}
          alt={tenant.business.name}
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = FALLBACK_COVER; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-paper" />

        {/* Logo icon top-left */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-10">
          {tenant.theme?.logo_url ? (
            <img
              src={tenant.theme.logo_url}
              alt={tenant.business.name}
              className="h-8 w-8 rounded-full object-cover border border-accent/40"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-[#0C0B09]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
          )}
          <a href={`tel:${tenant.business.phone}`} className="text-ink/70 hover:text-accent transition-colors no-underline">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12.9 19.79 19.79 0 0 1 1.15 4.27 2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
            </svg>
          </a>
        </div>

        {/* Hero content */}
        <div className="absolute bottom-8 left-0 right-0 px-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-accent/20 text-accent text-xs font-semibold px-2.5 py-1 rounded-full border border-accent/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] inline-block" />
              Abierto ahora
            </span>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-1 text-ink">
            {tenant.business.name.includes(" ")
              ? <>
                  {tenant.business.name.split(" ").slice(0, -1).join(" ")}<br />
                  <span className="text-accent">{tenant.business.name.split(" ").slice(-1)[0]}</span>
                </>
              : <span className="text-accent">{tenant.business.name}</span>
            }
          </h1>
          <p className="text-ink/60 text-sm mb-5">{tenant.business.address}</p>
          <Link
            to={`/demo/${tenant.slug}/reservar`}
            className="block w-full rounded-2xl bg-accent py-4 text-center font-bold text-base text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            Reservar ahora
          </Link>
        </div>
      </div>

      {/* ── Stats strip ───────────────────────────────────────────── */}
      {google_rating && (
        <div className="grid grid-cols-3 border-y border-line mx-5 lg:hidden">
          {[
            { val: `${google_rating}★`, label: "Calificación" },
            { val: google_review_count ? `${google_review_count >= 1000 ? (google_review_count/1000).toFixed(1)+'k' : google_review_count}` : "—", label: "Reseñas" },
            { val: "Premium", label: "Servicio" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center py-4 border-r last:border-r-0 border-line">
              <span className="text-base font-bold text-accent">{s.val}</span>
              <span className="text-[10px] text-muted mt-0.5 uppercase tracking-wider font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Welcome banner ────────────────────────────────────────── */}
      {firstName && (
        <div className="mx-5 md:mx-8 lg:mx-12 mt-5 flex flex-col items-center gap-3 rounded-2xl border border-accent/20 bg-accent/8 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="m-0 font-medium text-ink">Hola, {firstName} ¿Agendamos?</p>
          <Link
            to={`/demo/${tenant.slug}/reservar`}
            className="shrink-0 rounded-xl bg-accent px-5 py-2 text-sm font-bold text-[#0C0B09] no-underline transition-all hover:bg-accent-light active:scale-[0.98]"
          >
            Agendar ahora
          </Link>
        </div>
      )}

      {/* ── Servicios ─────────────────────────────────────────────── */}
      <section aria-labelledby="services-heading" className="px-5 md:px-8 lg:px-12 pt-8 pb-2">
        <div className="flex items-center justify-between mb-5">
          <h2 id="services-heading" className="text-xl font-bold text-ink">Servicios</h2>
          <Link to={`/demo/${tenant.slug}/reservar`} className="text-accent text-sm font-medium no-underline hover:opacity-80">
            Ver todos
          </Link>
        </div>
        <div
          className="flex flex-col gap-3 md:flex-row md:gap-4 md:overflow-x-auto md:pb-2 md:[-ms-overflow-style:none] md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {tenant.services.map((service) => (
            <Link
              key={service.id}
              to={`/demo/${tenant.slug}/reservar`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3 no-underline transition-all hover:border-accent/50 active:scale-[0.99] md:shrink-0 md:w-[340px]"
              style={{ scrollSnapAlign: "start" }}
            >
              <img
                  src={service.image_url || servicePhoto(tenant.services.indexOf(service))}
                  alt={service.name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-line"
                  onError={(e) => { e.currentTarget.style.opacity = '0.4' }}
                />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-ink">{service.name}</p>
                {service.description && (
                  <p className="text-xs text-muted mt-0.5 truncate">{service.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <ClockIcon /> {service.duration_minutes} min
                  </span>
                  <span className="text-xs font-bold text-accent">${service.price}</span>
                </div>
              </div>
              <div className="text-muted shrink-0">
                <ChevronRight />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Equipo ────────────────────────────────────────────────── */}
      {tenant.professionals && tenant.professionals.length > 0 && (
        <section className="pt-8 pb-2">
          <h2 className="text-xl font-bold text-ink px-5 md:px-8 lg:px-12 mb-5">Nuestro equipo</h2>
          <div
            className="flex gap-3 overflow-x-auto pb-2 px-5 md:px-8 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {tenant.professionals.map((pro) => (
              <div
                key={pro.id}
                className="shrink-0 w-[140px] md:w-[160px] bg-surface border border-line rounded-2xl p-3 text-center"
                style={{ scrollSnapAlign: "start" }}
              >
                <img
                  src={pro.image_url || professionalPhoto(tenant.professionals.indexOf(pro))}
                  alt={pro.name}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2 bg-line"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=C8973E&color=0C0B09&size=64` }}
                />
                <p className="text-sm font-semibold text-ink leading-tight">{pro.name}</p>
                {pro.specialty && <p className="text-xs text-muted mt-0.5">{pro.specialty}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Reseñas ───────────────────────────────────────────────── */}
      {tenant.reviews && tenant.reviews.length > 0 && (
        <section className="pt-8 pb-2">
          <h2 className="text-xl font-bold text-ink px-5 md:px-8 lg:px-12 mb-4">Lo que dicen</h2>
          <div className="flex gap-3 overflow-x-auto px-5 md:px-8 lg:px-12 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ scrollSnapType: "x mandatory" }}>
            {tenant.reviews.map((review, i) => (
              <div key={`${review.author}-${i}`} className="shrink-0 w-[220px] md:w-[280px] bg-surface border border-line rounded-2xl p-4" style={{ scrollSnapAlign: "start" }}>
                <div className="flex gap-0.5 text-accent mb-2">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <StarIcon key={j} />
                  ))}
                </div>
                <p className="text-xs text-ink/80 leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>
                <p className="text-xs font-semibold text-muted">— {review.author}</p>
              </div>
            ))}
          </div>
          {google_reviews_url && (
            <div className="px-5 md:px-8 lg:px-12 mt-3">
              <a href={google_reviews_url} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-accent hover:opacity-80 transition-opacity no-underline">
                Ver todas las reseñas en Google →
              </a>
            </div>
          )}
        </section>
      )}

      {/* ── Mapa / Ubicación ──────────────────────────────────────── */}
      <section aria-labelledby="map-heading" className="px-5 md:px-8 lg:px-12 pt-8 pb-2">
        <h2 id="map-heading" className="text-xl font-bold text-ink mb-4">Dónde encontrarnos</h2>
        <div className="bg-surface border border-line rounded-2xl overflow-hidden">
          {tenant.business.map_embed_url ? (
            <iframe
              title={`Mapa de ${tenant.business.name}`}
              src={tenant.business.map_embed_url}
              className="h-36 md:h-64 w-full border-0"
              loading="lazy"
            />
          ) : (
            <div className="h-36 md:h-64 bg-surface-alt flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg,#C8973E 0,#C8973E 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#C8973E 0,#C8973E 1px,transparent 1px,transparent 40px)"
                }}
              />
              <div className="flex flex-col items-center gap-2 text-accent z-10">
                <MapPinIcon />
                <span className="text-xs font-medium">Ver en Maps</span>
              </div>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-accent mt-0.5 shrink-0"><MapPinIcon /></span>
              <div>
                <p className="text-sm font-semibold text-ink">{tenant.business.address}</p>
                {tenant.business.phone && (
                  <a href={`tel:${tenant.business.phone}`} className="text-xs text-accent mt-0.5 block no-underline hover:opacity-80">
                    {tenant.business.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-5 md:px-8 lg:px-12 mt-8 pb-2 border-t border-line pt-5 text-sm">
        <a href={tenant.privacy_policy_url} className="text-muted hover:text-ink/60 transition-colors no-underline">
          Política de privacidad
        </a>
      </footer>

      <StickyCta slug={tenant.slug} />
    </ClientShell>
  );
}
