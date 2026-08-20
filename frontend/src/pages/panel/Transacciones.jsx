import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABEL = {
  pending: 'Pendiente',
  authorized: 'Autorizado',
  paid: 'Pagado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
  canceled: 'Cancelado',
}

const STATUS_COLOR = {
  pending:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
  authorized: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  paid:       'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20',
  failed:     'bg-red-500/15 text-red-400 border border-red-500/20',
  refunded:   'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  canceled:   'bg-[#2A2520] text-[#7A7065] border border-[#2A2520]',
}

function fmt(cents) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export function Transacciones() {
  const { token } = useAuth()
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  async function apiFetch(path) {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Error')
    return res.json()
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      const [data, sum] = await Promise.all([
        apiFetch(`/api/admin/transactions?${params}`),
        apiFetch('/api/admin/transactions/summary'),
      ])
      setPayments(data)
      setSummary(sum)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filters])

  async function loadDetail(id) {
    const events = await apiFetch(`/api/admin/transactions/${id}/events`)
    setDetail({ id, events })
  }

  function downloadCsv() {
    window.open(`/api/admin/transactions/export/csv`, '_blank')
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  const inputClass = 'rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3 py-2 text-sm text-[#F2EBE0] outline-none focus:border-[#C8973E] transition-colors'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#F2EBE0]">Transacciones</h1>
        <button
          onClick={downloadCsv}
          className="rounded-xl border border-[#C8973E] px-4 py-2 text-sm font-semibold text-[#C8973E] hover:bg-[#C8973E]/10 transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SumCard label="Ingresos netos" value={fmt(summary.net_cents)} green />
          <SumCard label="Pagados" value={`${summary.count_paid} · ${fmt(summary.total_paid_cents)}`} />
          <SumCard label="Reembolsados" value={`${summary.count_refunded} · ${fmt(summary.total_refunded_cents)}`} />
          <SumCard label="Fallidos" value={summary.count_failed} />
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={filters.status}
          onChange={e => setFilter('status', e.target.value)}
          className={inputClass + ' bg-[#1E1B15]'}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilter('date_from', e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilter('date_to', e.target.value)}
          className={inputClass}
        />
        {(filters.status || filters.date_from || filters.date_to) && (
          <button
            onClick={() => setFilters({ status: '', date_from: '', date_to: '' })}
            className="text-sm text-[#C8973E] hover:opacity-70 transition-opacity"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-[#7A7065]">Cargando…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2A2520] p-12 text-center text-[#7A7065]">
          No hay transacciones con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#2A2520]">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[#2A2520] bg-[#161410] text-xs text-[#7A7065]">
              <tr>
                {['Fecha', 'Cita', 'Monto', 'Estado', 'Proveedor', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2520]">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-[#1E1B15] transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-[#7A7065]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#7A7065]">{p.appointment_id.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-semibold text-[#F2EBE0]">{fmt(p.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status] ?? 'bg-[#2A2520] text-[#7A7065]'}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#7A7065] capitalize">{p.provider}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => loadDetail(p.id)}
                      className="text-xs font-semibold text-[#C8973E] hover:opacity-70 transition-opacity"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-[#2A2520] bg-[#161410] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-[#F2EBE0]">Historial de eventos</h2>
              <button onClick={() => setDetail(null)} className="text-[#7A7065] hover:text-[#F2EBE0] transition-colors text-xl leading-none">✕</button>
            </div>
            <p className="mb-4 font-mono text-xs text-[#7A7065]">{detail.id}</p>
            {detail.events.length === 0 ? (
              <p className="text-sm text-[#7A7065]">Sin eventos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.events.map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 rounded-xl border border-[#2A2520] bg-[#1E1B15] px-3 py-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C8973E]" />
                    <div>
                      <p className="text-sm font-semibold capitalize text-[#F2EBE0]">{ev.event_type}</p>
                      <p className="text-xs text-[#7A7065]">{fmtDate(ev.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function SumCard({ label, value, green }) {
  return (
    <div className={`rounded-xl border p-4 ${
      green
        ? 'border-[#10B981]/20 bg-[#10B981]/8'
        : 'border-[#2A2520] bg-[#1E1B15]'
    }`}>
      <p className="text-xs text-[#7A7065]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${green ? 'text-[#10B981]' : 'text-[#F2EBE0]'}`}>{value}</p>
    </div>
  )
}
