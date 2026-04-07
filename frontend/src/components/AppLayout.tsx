import { Navigate, Outlet } from 'react-router-dom'
import { isAuthenticated } from '@/lib/auth'
import AppSidebar from './AppSidebar'

export default function AppLayout() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
