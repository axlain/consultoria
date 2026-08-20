const ROLE_LABEL = { admin: 'Admin', host: 'Host', employee: 'Empleado', client: 'Cliente' }

// Shown when a login resolves to more than one active business membership —
// lets the user pick which tenant/panel to enter before we mint the app token.
export function BusinessSelect({ businesses, onSelect, loading }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[#7A7065]">Tu cuenta tiene acceso a varios negocios. Elige con cuál quieres entrar:</p>
      <div className="flex flex-col gap-2">
        {businesses.map(b => (
          <button
            key={b.business_id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(b.business_id)}
            className="flex items-center justify-between rounded-xl border border-[#2A2520] bg-[#1E1B15] px-4 py-3 text-left text-sm font-medium text-[#F2EBE0] transition-colors hover:border-[#C8973E]/40 hover:bg-[#C8973E]/5 disabled:opacity-50"
          >
            <span>{b.business_name}</span>
            <span className="rounded-full bg-[#2A2520] px-2 py-0.5 text-xs font-semibold text-[#7A7065]">
              {ROLE_LABEL[b.role] ?? b.role}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
