import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { TenantGate } from './pages/client/TenantGate'
import { TenantHome } from './pages/client/TenantHome'
import { BookingWizard } from './pages/client/wizard/BookingWizard'
import { ThankYou } from './pages/client/ThankYou'
import { AvailabilityCalendar } from './pages/client/AvailabilityCalendar'
import { CitaView } from './pages/client/CitaView'
import { AdminLayout } from './pages/admin/AdminLayout'
import { ResourceCalendar } from './pages/admin/ResourceCalendar'
import { ServiceCatalog } from './pages/admin/ServiceCatalog'
import { TeamPanel } from './pages/admin/TeamPanel'
import { NotFound } from './pages/NotFound'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { OAuthCallback } from './pages/auth/OAuthCallback'
import { PanelLayout } from './pages/panel/PanelLayout'
import { ClientPanelGate } from './pages/panel/ClientPanelGate'
import { MisCitas } from './pages/panel/MisCitas'
import { MisRewards } from './pages/panel/MisRewards'
import { MiAgenda } from './pages/panel/MiAgenda'
import { Equipo } from './pages/panel/Equipo'
import { NuevaCita } from './pages/panel/NuevaCita'
import { Transacciones } from './pages/panel/Transacciones'
import { Usuarios } from './pages/panel/Usuarios'
import { ProtectedRoute, roleHome } from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'

function RoleRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? roleHome(user.role) : '/login'} replace />
}

// React Router doesn't reset scroll on navigation by default — without this, going
// to a new page keeps whatever scroll offset the previous page was at, which can
// visually land mid-page (e.g. near the map section) instead of at a clean top.
// Skips when the URL carries a #hash — the target page owns scrolling to its anchor.
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Role-based panel */}
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <PanelLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleRedirect />} />

          {/* employee + host */}
          <Route path="mi-agenda" element={
            <ProtectedRoute roles={['employee', 'host', 'admin']}><MiAgenda /></ProtectedRoute>
          } />

          {/* host + admin */}
          <Route path="equipo" element={
            <ProtectedRoute roles={['host', 'admin']}><Equipo /></ProtectedRoute>
          } />
          <Route path="equipo/nueva-cita" element={
            <ProtectedRoute roles={['host', 'admin']}><NuevaCita /></ProtectedRoute>
          } />

          {/* admin only */}
          <Route path="transacciones" element={
            <ProtectedRoute roles={['admin']}><Transacciones /></ProtectedRoute>
          } />
          <Route path="usuarios" element={
            <ProtectedRoute roles={['admin']}><Usuarios /></ProtectedRoute>
          } />
        </Route>

        {/* Client panel — mobile-first ClientShell instead of the desktop panel sidebar */}
        <Route path="/panel/mis-citas" element={
          <ProtectedRoute roles={['client', 'admin']}>
            <ClientPanelGate><MisCitas /></ClientPanelGate>
          </ProtectedRoute>
        } />
        <Route path="/panel/mis-rewards" element={
          <ProtectedRoute roles={['client', 'admin']}>
            <ClientPanelGate><MisRewards /></ClientPanelGate>
          </ProtectedRoute>
        } />

        {/* Tenant-scoped public + legacy admin */}
        <Route path="/demo/:slug" element={<TenantGate />}>
          <Route index element={<TenantHome />} />
          <Route path="reservar" element={<BookingWizard />} />
          <Route path="disponibilidad" element={<AvailabilityCalendar />} />
          <Route path="gracias" element={<ThankYou />} />
          <Route path="cita/:aptId" element={<CitaView />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="agenda" replace />} />
            <Route path="agenda" element={<ResourceCalendar />} />
            <Route path="servicios" element={<ServiceCatalog />} />
            <Route path="equipo" element={<TeamPanel />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
