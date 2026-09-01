# AGENTS.md — Guía de tooling de agentes y CI/CD

> Nota: este documento se copió originalmente de otro repo (boilerplate de "figma-make-app" + un plan genérico de MCP/CI). Esta versión está adaptada al proyecto real. Sirve como **guía de referencia** para configurar MCPs locales, hooks de agente y el pipeline de CI/CD — no reemplaza a `CLAUDE.md` (arquitectura del producto) ni a `info.md` (requisitos RF/RNF).

## Qué es este proyecto

SaaS white-label multi-tenant de reservas para negocios de servicios (barberías, etc.). Monorepo con:

- `backend/` — FastAPI + Pydantic. Auth propia (JWT HS256 + bcrypt en `app/auth/`, no Supabase Auth) con RBAC vía `require_role`. Persistencia en Supabase/Postgres (`app/data/db.py`, `app/data/store.py`) — ver `supabase/migrations/`.
- `frontend/` — React 19 + Vite 6 + Tailwind v4 (JS, no TypeScript). `react-router-dom`, `react-big-calendar` (panel admin), `@stripe/react-stripe-js` (checkout).
- `core-booking-engine/packages/` — paquetes internos (`payments`, `qr`, `messaging`) consumidos por `frontend`/`backend` vía dependencias `file:`, no publicados a npm/PyPI.
- `supabase/migrations/` — esquema de la base de datos.

Para arquitectura y decisiones de producto, la fuente de verdad es `CLAUDE.md`. Este archivo (`AGENTS.md`) es solo la guía de tooling/CI descrita abajo.

**Comandos rápidos** (detalle completo en `CLAUDE.md` y `DESARROLLO_LOCAL.md`):

```bash
# backend
backend/venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# frontend
cd frontend && npm run dev      # http://localhost:5173
npm run lint && npm test        # eslint + vitest
```

---

## Parte 1 — Arquitectura: MCP / Agent Hooks (local) vs CI/CD (estricto)

Separación clara entre asistencia interactiva de IA y automatización de producción.

### 1. CI/CD real y estricto (GitHub Actions) — **ya implementado**

Ya existen dos workflows en `.github/workflows/`:

- **`ci.yml`**: job `frontend` (`npm ci` → `eslint` → `vitest` → `npm audit --audit-level=high` como **advertencia no bloqueante** → `vite build` con env vars dummy de Supabase) y job `backend` (instala requirements → smoke test de imports → `ruff check` → `pytest` si hay tests en `backend/tests/`).
- **`secret-scan.yml`**: Gitleaks contra todo el historial del PR.

**Pendiente / gap real hoy:**
- No hay paso de SAST (Semgrep u otro) en `ci.yml`.
- `npm audit` es `continue-on-error: true` — no bloquea el merge todavía; subirlo a bloqueante es una decisión pendiente, no un olvido (dependencias `file:` de `core-booking-engine` complican el audit).
- No hay `pip-audit`/Dependabot corriendo sobre `backend/requirements.txt`.

Sea cual sea la herramienta que se agregue, debe ser determinista (exit code puro), sin depender de sesiones de navegador o contexto conversacional.

### 2. Asistencia de desarrollo local (Claude Code / Cursor) — **plan, aún no instalado**

No hay `.mcp.json` ni `roborev.toml` en el repo todavía. Si se instalan:

- **Semgrep MCP** — consultas de seguridad conversacionales en tiempo real en el editor/terminal.
- **NotebookLM MCP** — research grounded contra `CLAUDE.md` / `info.md` (documentación interna del proyecto; no hay `BUILD_PLAN.md` en este repo).
- **roborev Agent Hook** — no es un servidor MCP, es un *hook* nativo del agente (Stop / PreToolUse / PostToolUse) que vigila la sesión y recuerda revisiones de código fallidas sin intervención manual. Ver Parte 4.

**Nota operativa:** ninguna de estas tres correría en pipelines de CI. NotebookLM MCP requiere sesión activa de Google; Semgrep MCP está optimizado para consultas de agente, no para devolver un exit code de CI; roborev Agent Hook falla "abierto" (si no puede contactar al daemon, el harness recibe una respuesta vacía y no bloquea nada) — es un recordatorio, no un gate. **El único gate real sigue siendo el pipeline de GitHub Actions.**

---

## Parte 2 — Buenas prácticas de código, validación y ciberseguridad (OWASP Top 10)

Estado real en este repo, no solo aspiracional:

### 1. Validación y sanitización estricta de entradas

- Backend: **ya usa Pydantic** (`app/models/schemas.py`) para validar en los límites del sistema (endpoints de `routers/`).
- Frontend: **sin librería de validación de esquemas** (no hay Zod ni similar) — los formularios (booking wizard, admin) validan a mano. Si crecen en complejidad, considerar Zod antes de que la validación ad-hoc se vuelva inconsistente.

### 2. Autenticación y autorización seguras

- **Ya implementado**: JWT HS256 propio (`app/auth/jwt_hs256.py`), hashing de contraseñas con bcrypt (`app/auth/pwd.py`), RBAC por rol vía `require_role` (`app/auth/dependencies.py`), tokens con expiración de 8h.
- Esto contradice la sección "Known gap: no admin auth" de `CLAUDE.md` (que describe el panel admin como sin autenticación) — vale la pena verificar cuál de los dos documentos está desactualizado antes de asumir uno u otro. Ver `app/routers/auth.py` y `app/routers/admin_users.py` para el estado real.
- Secretos vía variables de entorno (`app/core/config.py`, `JWT_SECRET`, claves de Supabase/Stripe) — nunca hardcodear credenciales ni commitear `.env`.

### 3. Protección contra inyecciones y fallas comunes

- Acceso a datos vía cliente de Supabase (`app/data/db.py`), no SQL crudo concatenado — evitar construir queries con f-strings si en algún punto se usa SQL directo.
- Evitar `eval()` / `exec()` y deserializaciones inseguras.

### 4. Resiliencia, observabilidad y manejo de errores

- CORS ya configurado en `app/main.py` (`CORSMiddleware`, `allow_origins=CORS_ORIGINS`) — verificar que `CORS_ORIGINS` esté acotado a dominios reales en producción, no `*`.
- CSP/HSTS: no configurados explícitamente todavía (pendiente si se sirve detrás de un proxy/CDN que no los agregue).
- Tests: `backend/tests/test_smoke.py` y `frontend/src/components/BusinessSelect.test.jsx` existen pero la cobertura es mínima — priorizar tests sobre `booking_service.py` (doble-booking, RF05) y sobre el flujo de pagos (Stripe) antes que sobre UI.

---

## Parte 3 — Stack de frontend (UI/UX)

Para que el código generado no parezca el template genérico de Bootstrap:

- **Skill de UI/UX (GitHub — `ui-ux-pro-max-skill`):** repositorio que inyecta reglas de diseño estético, patrones de interacción y buenas prácticas a la IA de terminal antes de generar componentes. *(plan, no instalado)*
- **MCP de componentes (21st.dev):** protocolo de contexto que conecta componentes visuales avanzados directamente al entorno de desarrollo. *(plan, no instalado)*
- **Animación — Framer Motion (npm, React):** librería estándar para transiciones fluidas y efectos al hacer scroll. *(no está en `frontend/package.json` todavía)*

Instalación base si se adopta:

```bash
cd frontend && npm install framer-motion
```

Config MCP sugerida (agregar a `.mcp.json`, que hoy no existe en el repo):

```json
{
  "mcpServers": {
    "21st-dev": {
      "command": "npx",
      "args": ["-y", "@21st-dev/mcp-server"]
    }
  }
}
```

> Verificar el comando exacto del servidor en la documentación de 21st.dev al momento de instalar — los paquetes de MCP cambian de versión con frecuencia.

---

## Parte 4 — roborev Agent Hook (recordatorios automáticos de revisión)

*(Plan — no instalado en este repo todavía; no hay `roborev.toml` ni hooks configurados en `.claude/settings.local.json`.)*

`roborev agent-hook` conecta las revisiones asíncronas de roborev con los hooks nativos del agente (Claude Code, Codex, Cursor, Copilot CLI, Factory Droid, Gemini CLI, Hermes, Qwen Code). Registra eventos de shell y de fin de turno (Stop), revisa si hay reviews fallidos abiertos, y recuerda al agente activo que los corrija antes de que la sesión se enfríe.

**Importante:** esto es distinto de un servidor MCP. Roborev escribe hooks directamente en la config nativa del harness (`.claude/settings.json` en este repo), no expone tools MCP.

### Qué vigila

- **Turnos:** eventos Stop, para reparación periódica en sesiones largas.
- **Commits:** eventos de shell normalizados (PreToolUse/PostToolUse) mapeados al vocabulario común de shell.
- **Reviews fallidos:** reviews abiertos, no cerrados, con veredicto `failed`.

Todo se limita al linaje del repositorio (repository lineage), así que la actividad en un worktree no consume el contador de recordatorios de otro worktree. Fuera de un repo git rastreado, el hook no hace nada.

### Instalación

```bash
# Instala hooks para todos los agentes detectados localmente
roborev agent-hook install

# O selecciona uno específico
roborev agent-hook install --agent claude

# Instala los nueve perfiles disponibles explícitamente
roborev agent-hook install --agent all
```

Para Claude Code, Codex, Factory Droid y Grok Build, la instalación también crea/actualiza los skills de roborev de ese perfil antes de activar el hook.

### Configuración (`roborev.toml`, sección `[agent_hook]`)

```toml
[agent_hook]
turn_threshold = 5
commit_threshold = 3
failed_review_threshold = 4
instruction = "Resuelve los hallazgos abiertos de roborev ahora."

fix_guidelines = """
Trata cada hallazgo de review como una hipótesis, no como un hecho.
Verifica cada uno contra el código y los requisitos del proyecto (CLAUDE.md, info.md).
Documenta y explica los hallazgos que no apliquen, sin tocar código.
Corrige y verifica los hallazgos válidos que estén dentro del alcance de la tarea actual.
Deja abiertos los hallazgos válidos fuera de alcance o poco claros hasta que el usuario dé dirección.
"""
```

- `turn_threshold` = 0 desactiva el disparador por turnos; igual para los demás.
- El skill `roborev-fix` que se invoca trata cada finding como no verificado: nunca corre `roborev fix --open` a ciegas ni descubre reviews adicionales por su cuenta — solo actúa sobre los IDs de review nombrados explícitamente.
- Resolución de configuración: `run flags > variables de entorno > sección del perfil en TOML > defaults`.

### Snoozing (pausar recordatorios durante trabajo largo)

```bash
roborev snooze                 # 8 horas por defecto
roborev snooze on --duration 2h
roborev snooze off             # reanudar de inmediato
```

El snooze aplica solo al worktree/branch actual. Los reviews se siguen generando y acumulando; solo se silencia el recordatorio al agente. Ver estado con `roborev status`.

### Inspección de sesión

```bash
roborev agent-hook status
roborev agent-hook reset <session-id>
roborev agent-hook reset --all
```

---

## Parte 5 — Plan de implementación (checklist por fases)

### Fase 1 — Configuración local del entorno de agentes (Cursor / Claude Code)

- [ ] **1.1** Configurar servidores MCP en `.mcp.json` (no existe todavía):
  - Semgrep MCP para revisión de seguridad conversacional.
  - NotebookLM MCP apuntando a `CLAUDE.md` / `info.md`.
  - 21st.dev MCP para componentes visuales avanzados (frontend).
- [ ] **1.2** Linters ya existen (`eslint` en frontend, `ruff` en backend) — falta agregar hooks de pre-commit (`husky` o `pre-commit`) que los corran antes de cada commit, no solo en CI.
- [ ] **1.3** Instalar y configurar `roborev agent-hook` (ver Parte 4): `roborev agent-hook install`, ajustar thresholds y `fix_guidelines` en `roborev.toml`.
- [ ] **1.4** Instalar stack de UI/UX de frontend: activar el skill `ui-ux-pro-max-skill`, conectar MCP de 21st.dev, instalar Framer Motion (`npm install framer-motion`).

### Fase 2 — Endurecer el pipeline en GitHub Actions (`.github/workflows/`)

- [x] **2.0** `ci.yml` (lint + tests + build de frontend y backend) y `secret-scan.yml` (Gitleaks) ya corren en cada push/PR a `main`/`develop`.
- [ ] **2.1** Agregar paso de SAST con Semgrep a `ci.yml`:

  ```yaml
  - name: Run Semgrep CI
    uses: semgrep/semgrep-action@v1
    env:
      SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}
  ```

- [ ] **2.2** Subir `npm audit --audit-level=high` de advertencia a bloqueante (hoy tiene `continue-on-error: true`), y agregar `pip-audit` para `backend/requirements.txt`.
- [ ] **2.3** Ampliar cobertura de pytest/vitest más allá del smoke test actual, priorizando `booking_service.py` (RF05, doble-booking) y el flujo de pagos con Stripe.
- [ ] **2.4** Confirmar que roborev **no** corre como job de CI cuando se instale — su hook vive solo en la sesión local del agente; el gate de merge lo da únicamente este pipeline.

### Fase 3 — Gobierno y revisión continua

- [ ] **3.1** Antes de abrir un PR, apoyarse en el agente local (Semgrep MCP + NotebookLM MCP, una vez instalados) para auditar los cambios y verificar que cumplan con `CLAUDE.md`/`info.md`. Los recordatorios de `roborev agent-hook` (por turnos, commits o reviews fallidos) refuerzan esto automáticamente durante la sesión, invocando el skill `roborev-fix` sobre los IDs de review señalados.
- [ ] **3.2** Ningún PR se fusiona a `main`/`develop` sin que `ci.yml` y `secret-scan.yml` hayan pasado.
- [ ] **3.3** En sesiones largas de implementación donde los recordatorios interrumpen el flujo, usar `roborev snooze on --duration <n>h` en vez de ignorarlos — los reviews se siguen acumulando y hay que resolverlos antes de abrir el PR (paso 3.1).
