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
  pending: 'bg-yellow-100 text-yellow-800',
  authorized: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  canceled: 'bg-gray-100 text-gray-700',
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
    window.open(
      `/api/admin/transactions/export/csv`,
      '_blank'
    )
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1c1c1e]">Transacciones</h1>
        <button
          onClick={downloadCsv}
          className="rounded-lg border border-[#c9a24b] px-4 py-2 text-sm font-semibold text-[#c9a24b] hover:bg-[#fdf8ef]"
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
          className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input
          type="date"
          value={filters.date_from}
          onChange={e => setFilter('date_from', e.target.value)}
          className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
          placeholder="Desde"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={e => setFilter('date_to', e.target.value)}
          className="rounded-lg border border-[#d1d1d6] px-3 py-2 text-sm outline-none focus:border-[#c9a24b]"
          placeholder="Hasta"
        />
        {(filters.status || filters.date_from || filters.date_to) && (
          <button
            onClick={() => setFilters({ status: '', date_from: '', date_to: '' })}
            className="text-sm text-[#c9a24b] hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="py-12 text-center text-sm text-[#6e6e73]">Cargando…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#d1d1d6] p-12 text-center text-[#6e6e73]">
          No hay transacciones con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#d1d1d6]">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f5f5f5] text-xs text-[#6e6e73]">
              <tr>
                {['Fecha', 'Cita', 'Monto', 'Estado', 'Proveedor', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0]">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-[#fafafa]">
                  <td className="whitespace-nowrap px-4 py-3 text-[#3a3a3c]">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6e6e73]">{p.appointment_id.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-semibold text-[#1c1c1e]">{fmt(p.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6e6e73] capitalize">{p.provider}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => loadDetail(p.id)}
                      className="text-xs text-[#c9a24b] hover:underline"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-[#1c1c1e]">Historial de eventos</h2>
              <button onClick={() => setDetail(null)} className="text-[#6e6e73] hover:text-[#1c1c1e]">✕</button>
            </div>
            <p className="mb-4 font-mono text-xs text-[#6e6e73]">{detail.id}</p>
            {detail.events.length === 0 ? (
              <p className="text-sm text-[#6e6e73]">Sin eventos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.events.map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 rounded-lg bg-[#f5f5f5] px-3 py-2">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#c9a24b]" />
                    <div>
                      <p className="text-sm font-semibold capitalize text-[#1c1c1e]">{ev.event_type}</p>
                      <p className="text-xs text-[#6e6e73]">{fmtDate(ev.created_at)}</p>
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
    <div className={`rounded-xl border p-4 ${green ? 'border-green-200 bg-green-50' : 'border-[#d1d1d6]'}`}>
      <p className="text-xs text-[#6e6e73]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${green ? 'text-green-700' : 'text-[#1c1c1e]'}`}>{value}</p>
    </div>
  )
}
