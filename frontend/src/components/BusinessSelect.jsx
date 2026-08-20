const ROLE_LABEL = { admin: 'Admin', host: 'Host', employee: 'Empleado', client: 'Cliente' }

// Shown when a login resolves to more than one active business membership —
// lets the user pick which tenant/panel to enter before we mint the app token.
export function BusinessSelect({ businesses, onSelect, loading }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">Tu cuenta tiene acceso a varios negocios. Elige con cuál quieres entrar:</p>
      <div className="flex flex-col gap-2">
        {businesses.map(b => (
          <button
            key={b.business_id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(b.business_id)}
            className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:opacity-50"
          >
            <span>{b.business_name}</span>
            <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">
              {ROLE_LABEL[b.role] ?? b.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
