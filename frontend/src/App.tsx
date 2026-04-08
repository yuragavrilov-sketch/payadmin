import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MerchantsPage from '@/pages/MerchantsPage'
import AppLayout from '@/components/AppLayout'
import HostsPage from '@/pages/HostsPage'
import MonitoringPage from '@/pages/MonitoringPage'
import AuditLogPage from '@/pages/AuditLogPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/merchants" element={<MerchantsPage />} />
          <Route path="/infra/hosts" element={<HostsPage />} />
          <Route path="/infra/monitoring" element={<MonitoringPage />} />
          <Route path="/infra/audit" element={<AuditLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
