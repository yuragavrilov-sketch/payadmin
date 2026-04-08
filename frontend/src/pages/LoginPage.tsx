import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { login } from '@/lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/merchants')
    } catch {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[420px] bg-blue-600 text-white flex-col justify-between p-10">
        <div>
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            PA
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-semibold mb-2">Payment Gateway</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Merchant management, transaction monitoring, and system configuration in one place.
          </p>
        </div>
        <p className="text-blue-300 text-xs">TransCapital &copy; 2026</p>
      </div>

      {/* Right form area */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-xl inline-flex items-center justify-center text-white text-lg font-bold mb-4">
              PA
            </div>
          </div>

          <h1 className="text-xl font-semibold text-slate-800 mb-1">Sign in to PayAdmin</h1>
          <p className="text-slate-400 text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-slate-600 text-sm font-medium mb-1.5">
                Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-slate-600 text-sm font-medium mb-1.5">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-xs mt-8">Authenticated via corporate LDAP</p>
        </div>
      </div>
    </div>
  )
}
