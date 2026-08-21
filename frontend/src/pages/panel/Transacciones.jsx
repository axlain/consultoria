import { useEffect, useState } from 'react'
import { api } from '../../api/client'

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
  canceled:   'bg-line text-muted border border-line',
}

function fmt(cents) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100)
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export function Transacciones() {
  const [payments, setPayments] = useState([])
  const [summary, setSummary] = useState(null)
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [csvLoading, setCsvLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.date_from) params.set('date_from', filters.date_from)
      if (filters.date_to) params.set('date_to', filters.date_to)
      const [data, sum] = await Promise.all([
        api.getTransactions(params),
        api.getTransactionsSummary(),
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
    const events = await api.getTransactionEvents(id)
    setDetail({ id, events })
  }

  async function downloadCsv() {
    setCsvLoading(true)
    setError('')
    try {
      const blob = await api.exportTransactionsCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'transacciones.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    } finally {
      setCsvLoading(false)
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  const inputClass = 'rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors'

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-ink">Transacciones</h1>
        <button
          onClick={downloadCsv}
          disabled={csvLoading}
          className="rounded-xl border border-accent px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors disabled:opacity-50"
        >
          {csvLoading ? 'Exportando…' : 'Exportar CSV'}
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
          className={inputClass + ' bg-surface'}
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
            className="text-sm text-accent hover:opacity-70 transition-opacity"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-muted">Cargando…</div>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-12 text-center text-muted">
          No hay transacciones con los filtros seleccionados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="min-w-full text-sm">
            <thead className="border-b border-line bg-surface-alt text-xs text-muted">
              <tr>
                {['Fecha', 'Cita', 'Monto', 'Estado', 'Proveedor', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-surface transition-colors">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{p.appointment_id.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-semibold text-ink">{fmt(p.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLOR[p.status] ?? 'bg-line text-muted'}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">{p.provider}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => loadDetail(p.id)}
                      className="text-xs font-semibold text-accent hover:opacity-70 transition-opacity"
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
          <div className="w-full max-w-lg rounded-2xl border border-line bg-surface-alt p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">Historial de eventos</h2>
              <button onClick={() => setDetail(null)} className="text-muted hover:text-ink transition-colors text-xl leading-none">✕</button>
            </div>
            <p className="mb-4 font-mono text-xs text-muted">{detail.id}</p>
            {detail.events.length === 0 ? (
              <p className="text-sm text-muted">Sin eventos registrados.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.events.map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3 py-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-semibold capitalize text-ink">{ev.event_type}</p>
                      <p className="text-xs text-muted">{fmtDate(ev.created_at)}</p>
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
        : 'border-line bg-surface'
    }`}>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-xl font-bold ${green ? 'text-[#10B981]' : 'text-ink'}`}>{value}</p>
    </div>
  )
}
