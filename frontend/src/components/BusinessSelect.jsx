const ROLE_LABEL = { admin: 'Admin', host: 'Host', employee: 'Empleado', client: 'Cliente' }

// Shown when a login resolves to more than one active business membership —
// lets the user pick which tenant/panel to enter before we mint the app token.
export function BusinessSelect({ businesses, onSelect, loading }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#6e6e73]">Tu cuenta tiene acceso a varios negocios. Elige con cuál quieres entrar:</p>
      <div className="flex flex-col gap-2">
        {businesses.map(b => (
          <button
            key={b.business_id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(b.business_id)}
            className="flex items-center justify-between rounded-lg border border-[#d1d1d6] px-4 py-3 text-left text-sm font-medium text-[#1c1c1e] transition-colors hover:border-[#c9a24b] hover:bg-[#fdf8ef] disabled:opacity-50"
          >
            <span>{b.business_name}</span>
            <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-xs font-semibold text-[#6e6e73]">
              {ROLE_LABEL[b.role] ?? b.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
