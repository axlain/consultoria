import { Navigate, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { TenantGate } from './pages/client/TenantGate'
import { TenantHome } from './pages/client/TenantHome'
import { BookingWizard } from './pages/client/wizard/BookingWizard'
import { ThankYou } from './pages/client/ThankYou'
import { AdminLayout } from './pages/admin/AdminLayout'
import { ResourceCalendar } from './pages/admin/ResourceCalendar'
import { ServiceCatalog } from './pages/admin/ServiceCatalog'
import { TeamPanel } from './pages/admin/TeamPanel'
import { NotFound } from './pages/NotFound'

// RF01: tenant is resolved from the URL (/demo/:slug) and everything nested under it
// shares that tenant's config via TenantGate.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo/:slug" element={<TenantGate />}>
        <Route index element={<TenantHome />} />
        <Route path="reservar" element={<BookingWizard />} />
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
