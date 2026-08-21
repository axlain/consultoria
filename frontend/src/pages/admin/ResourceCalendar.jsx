import { useTenant } from '../../context/TenantContext'
import { TeamCalendar } from '../../components/TeamCalendar'

// RF06: thin tenant-scoped wrapper around the shared TeamCalendar — see that
// component for the actual resource-grid/mobile-list implementation, also
// reused by the role-based staff panel's /panel/equipo.
export function ResourceCalendar() {
  const { tenant, refreshTenant } = useTenant()
  return <TeamCalendar tenant={tenant} onRefresh={refreshTenant} title="Agenda completa" />
}
