# Cómo correr el proyecto en local

El proyecto tiene dos partes independientes que deben correr al mismo tiempo:

| Parte | Tecnología | Puerto |
|---|---|---|
| Backend (API) | Python · FastAPI | `http://127.0.0.1:8000` |
| Frontend (UI) | Node · React · Vite | `http://localhost:5173` |

---

## Requisitos previos

| Herramienta | Versión mínima | Cómo verificar |
|---|---|---|
| Python | 3.10+ | `python3 --version` |
| pip | cualquiera | `pip3 --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |

---

## 1. Backend

Abre una terminal y ejecuta los siguientes comandos **en orden**:

```bash
# 1. Entra a la carpeta del backend
cd consultoria/backend

# 2. Crea un entorno virtual (solo la primera vez)
python3 -m venv .venv

# 3. Activa el entorno virtual
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# 4. Instala las dependencias (solo la primera vez, o cuando cambie requirements.txt)
pip install -r requirements.txt

# 5. Levanta el servidor con recarga automática
uvicorn app.main:app --reload
```

El backend queda en **`http://127.0.0.1:8000`**.  
Puedes verificar que funciona abriendo `http://127.0.0.1:8000/api/health` — debe responder `{"status":"ok"}`.  
La documentación interactiva de la API está en `http://127.0.0.1:8000/docs`.

> **Nota:** la bandera `--reload` hace que el servidor se reinicie automáticamente cada vez que guardas un archivo Python. Úsala solo en desarrollo.

---

## 2. Frontend

Abre **otra terminal** (deja el backend corriendo) y ejecuta:

```bash
# 1. Entra a la carpeta del frontend
cd consultoria/frontend

# 2. Instala las dependencias (solo la primera vez, o cuando cambie package.json)
npm install

# 3. Levanta el servidor de desarrollo
npm run dev
```

El frontend queda en **`http://localhost:5173`**.

---

## 3. Acceder a la aplicación

Con ambos servidores corriendo, abre el navegador en:

| URL | Qué es |
|---|---|
| `http://localhost:5173/demo/levisalon-keratinas` | Página pública del negocio |
| `http://localhost:5173/demo/levisalon-keratinas/reservar` | Wizard de reservación (5 pasos) |
| `http://localhost:5173/demo/levisalon-keratinas/disponibilidad` | Calendario de disponibilidad pública |
| `http://localhost:5173/demo/levisalon-keratinas/admin/agenda` | Panel de administración |
| `http://127.0.0.1:8000/docs` | Documentación interactiva de la API |

---

## 4. Estructura de terminales recomendada

Necesitas **dos terminales abiertas al mismo tiempo**:

```
Terminal 1 (backend)          Terminal 2 (frontend)
──────────────────────        ──────────────────────
cd consultoria/backend        cd consultoria/frontend
source .venv/bin/activate     npm install
pip install -r requirements.txt
uvicorn app.main:app --reload npm run dev
```

---

## 5. Detener los servidores

En cada terminal presiona `Ctrl + C`.

---

## Solución de problemas comunes

**"No module named 'fastapi'"**  
El entorno virtual no está activado. Corre `source .venv/bin/activate` antes de `uvicorn`.

**"vite: command not found"**  
Las dependencias no están instaladas. Corre `npm install` dentro de `frontend/`.

**El frontend carga pero la API no responde**  
Verifica que el backend esté corriendo en el puerto `8000`. El frontend apunta a `http://127.0.0.1:8000` por defecto (definido en `frontend/.env` o la variable `VITE_API_URL`).

**Puerto 8000 o 5173 ya en uso**  
```bash
# Ver qué proceso usa el puerto
lsof -i :8000
lsof -i :5173

# Terminar ese proceso (reemplaza PID con el número que aparece)
kill -9 PID
```
