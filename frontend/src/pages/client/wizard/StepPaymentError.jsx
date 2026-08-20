// RF-Pagos: generic error screen shown when payment status = "failed" or is canceled.
export function StepPaymentError({ onRetry, onCancel }) {
  return (
    <section className="flex flex-col items-center text-center">
      <svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden="true"
        className="mx-auto mb-5 text-[#c0392b]"
      >
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
        <path
          d="M20 20 L36 36 M36 20 L20 36"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <h2 className="mb-2">Pago no procesado</h2>
      <p className="text-muted mb-6 text-sm">
        Hubo un problema al procesar tu pago. Tu cita sigue reservada. Puedes intentar de nuevo o
        pagar directamente en el local.
      </p>

      <button
        type="button"
        className="bg-accent mb-3 w-full rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]"
        onClick={onRetry}
      >
        Intentar de nuevo
      </button>

      <button
        type="button"
        className="text-muted w-full bg-transparent border-0 text-sm underline"
        onClick={onCancel}
      >
        Pagar en el local
      </button>
    </section>
  )
}
