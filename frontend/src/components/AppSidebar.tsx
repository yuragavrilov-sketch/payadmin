import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, CreditCard, Settings, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUserInfo, logout } from '@/lib/auth'

const navItems = [
  { icon: Home, label: 'Merchants', path: '/merchants' },
  { icon: CreditCard, label: 'Transactions', path: '/transactions', disabled: true },
  { icon: Settings, label: 'Settings', path: '/settings', disabled: true },
]

export default function AppSidebar() {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUserInfo()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const roleLabel = user?.roles.includes('ADMIN')
    ? 'ADMIN'
    : user?.roles.includes('OPERATOR')
      ? 'OPERATOR'
      : 'VIEWER'

  return (
    <div
      className={cn(
        'h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-200',
        expanded ? 'w-52' : 'w-[52px]'
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Brand */}
      <div className="p-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          PA
        </div>
      </div>

      <div className="mx-2.5 border-t border-slate-100" />

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 mt-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => !item.disabled && navigate(item.path)}
              disabled={item.disabled}
              className={cn(
                'relative flex items-center gap-3 rounded-lg p-2 text-sm transition-colors',
                active
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : item.disabled
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              )}
            >
              {active && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-blue-600" />
              )}
              <item.icon className="w-5 h-5 shrink-0" />
              {expanded && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-2 border-t border-slate-100">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.username?.substring(0, 2).toUpperCase() || '??'}
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-700 truncate">{user?.username}</div>
              <div className="text-xs text-slate-400">{roleLabel}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg p-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 w-full transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {expanded && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
