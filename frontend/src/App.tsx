import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/LoginPage'
import MerchantsPage from '@/pages/MerchantsPage'
import AppLayout from '@/components/AppLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppLayout />}>
          <Route path="/merchants" element={<MerchantsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
