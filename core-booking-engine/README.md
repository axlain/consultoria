# core-booking-engine

Monorepo de paquetes compartidos para el sistema de reservas multi-tenant.

## Paquetes

| Paquete | Descripción |
|---------|-------------|
| `@consultoria/payments` | Abstracción de proveedores de pago, máquina de estados, helpers de Supabase |
| `@consultoria/messaging` | Abstracción de mensajería (email / WhatsApp) |
| `@consultoria/qr` | Generación y validación de QR firmados con JWT |

## Requisitos

- Node.js ≥ 18
- npm ≥ 9

## Instalación

```bash
npm install
```

## Build

```bash
npm run build
```

Compila todos los paquetes en sus respectivos directorios `dist/`.

## Tests E2E

Requieren el backend corriendo en `http://localhost:8000` (o `BASE_URL`):

```bash
BASE_URL=http://localhost:8000 npx playwright test
```

## Variables de entorno

Crea un archivo `.env` en el paquete que lo necesite (nunca commitear):

```env
# packages/payments
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

## Seguridad

- Montos **siempre en centavos** (entero). Nunca decimales.
- Datos de tarjeta **nunca llegan al servidor**.
- Tokens QR firmados con HMAC-SHA256, incluyen `exp`.
- RLS de Supabase por `business_id` para aislamiento multi-tenant.
