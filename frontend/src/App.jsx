import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { TenantGate } from './pages/client/TenantGate'
import { TenantHome } from './pages/client/TenantHome'
import { BookingWizard } from './pages/client/wizard/BookingWizard'
import { ThankYou } from './pages/client/ThankYou'
import { AvailabilityCalendar } from './pages/client/AvailabilityCalendar'
import { AdminLayout } from './pages/admin/AdminLayout'
import { ResourceCalendar } from './pages/admin/ResourceCalendar'
import { ServiceCatalog } from './pages/admin/ServiceCatalog'
import { TeamPanel } from './pages/admin/TeamPanel'
import { NotFound } from './pages/NotFound'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { PanelLayout } from './pages/panel/PanelLayout'
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

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

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

        {/* client */}
        <Route path="mis-citas" element={
          <ProtectedRoute roles={['client', 'admin']}><MisCitas /></ProtectedRoute>
        } />
        <Route path="mis-rewards" element={
          <ProtectedRoute roles={['client', 'admin']}><MisRewards /></ProtectedRoute>
        } />

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

      {/* Tenant-scoped public + legacy admin */}
      <Route path="/demo/:slug" element={<TenantGate />}>
        <Route index element={<TenantHome />} />
        <Route path="reservar" element={<BookingWizard />} />
        <Route path="disponibilidad" element={<AvailabilityCalendar />} />
        <Route path="gracias" element={<ThankYou />} />
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
  )
}

export default App
