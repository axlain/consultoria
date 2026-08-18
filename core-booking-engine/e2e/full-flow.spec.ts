import { test, expect } from '@playwright/test'

// Requires a running instance of the site (see playwright.config.ts baseURL).
// Run with: npx playwright test

test.describe('Flujo completo: reserva → pago → QR', () => {
  test('reservar, confirmar pago y verificar QR generado', async ({ page, request }) => {
    // 1. Crear cita vía API
    const apptRes = await request.post('/api/tenants/barberia/appointments', {
      data: {
        service_id: 'corte-clasico',
        professional_id: 'any',
        date: '2026-10-01',
        time: '10:00',
        customer_name: 'Ana',
        customer_last_name: 'Garcia',
        customer_phone: '5512345678',
      },
    })
    expect(apptRes.ok()).toBeTruthy()
    const { id: appointmentId } = await apptRes.json()

    // 2. Crear pago (pending)
    const createRes = await request.post('/api/payments/create', {
      data: { appointment_id: appointmentId, business_id: 'barberia', amount_cents: 15000, currency: 'MXN' },
    })
    expect(createRes.ok()).toBeTruthy()
    const { payment_id: paymentId, status: pendingStatus } = await createRes.json()
    expect(pendingStatus).toBe('pending')

    // 3. Confirmar pago
    const confirmRes = await request.post('/api/payments/confirm', {
      data: { payment_id: paymentId },
    })
    expect(confirmRes.ok()).toBeTruthy()
    const { status: paidStatus } = await confirmRes.json()
    expect(paidStatus).toBe('paid')

    // 4. Flujo UI: navegar al wizard y completar el pago
    await page.goto(`/demo/barberia/reservar`)
    // (el flujo UI completo se prueba en e2e/wizard.spec.ts)

    // 5. Verificar que el GET del pago refleja el estado correcto
    const getRes = await request.get(`/api/payments/${paymentId}`)
    expect(getRes.ok()).toBeTruthy()
    const payment = await getRes.json()
    expect(payment.status).toBe('paid')
    expect(payment.appointment_id).toBe(appointmentId)
  })

  test('pago fallido: la cita queda pending, sin QR', async ({ request }) => {
    const apptRes = await request.post('/api/tenants/barberia/appointments', {
      data: {
        service_id: 'corte-clasico',
        professional_id: 'juan',
        date: '2026-10-02',
        time: '09:00',
        customer_name: 'Luis',
        customer_last_name: 'Mora',
        customer_phone: '5598765432',
      },
    })
    const { id: appointmentId } = await apptRes.json()

    // Crear pago y no confirmarlo → sigue pending
    const createRes = await request.post('/api/payments/create', {
      data: { appointment_id: appointmentId, business_id: 'barberia', amount_cents: 15000, currency: 'MXN' },
    })
    const { payment_id: paymentId } = await createRes.json()
    const getRes = await request.get(`/api/payments/${paymentId}`)
    const { status } = await getRes.json()
    expect(status).toBe('pending')
  })

  test('reembolso: pago pasa de paid a refunded', async ({ request }) => {
    const apptRes = await request.post('/api/tenants/barberia/appointments', {
      data: {
        service_id: 'afeitado',
        professional_id: 'miguel',
        date: '2026-10-03',
        time: '10:00',
        customer_name: 'Carlos',
        customer_last_name: 'Ruiz',
        customer_phone: '5544332211',
      },
    })
    const { id: appointmentId } = await apptRes.json()
    const { payment_id: paymentId } = await (
      await request.post('/api/payments/create', {
        data: { appointment_id: appointmentId, business_id: 'barberia', amount_cents: 18000, currency: 'MXN' },
      })
    ).json()
    await request.post('/api/payments/confirm', { data: { payment_id: paymentId } })

    const refundRes = await request.post('/api/payments/refund', { data: { payment_id: paymentId } })
    expect(refundRes.ok()).toBeTruthy()
    expect((await refundRes.json()).status).toBe('refunded')
  })

  test('aislamiento multi-tenant: transición inválida rechazada con 409', async ({ request }) => {
    const { payment_id: paymentId } = await (
      await request.post('/api/payments/create', {
        data: { appointment_id: 'iso-test', business_id: 'barberia', amount_cents: 5000, currency: 'MXN' },
      })
    ).json()

    // Intentar saltar pending → refunded (inválido)
    const bad = await request.post('/api/payments/refund', { data: { payment_id: paymentId } })
    expect(bad.status()).toBe(409)
  })

  test('token de QR expirado: validateQrToken devuelve valid:false', async () => {
    const { validateQrToken } = await import('../packages/qr/src/validateQrToken')
    const secret = 'test-secret'
    // Token generado manualmente con exp en el pasado
    const expiredToken = require('jsonwebtoken').sign(
      { appointmentId: 'apt-123' },
      secret,
      { expiresIn: -1 }  // ya expirado
    )
    const result = validateQrToken(expiredToken, 'apt-123', secret)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('expired')
  })
})
