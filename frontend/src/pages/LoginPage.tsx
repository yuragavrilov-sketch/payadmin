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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-[380px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="pt-8 pb-6 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl inline-flex items-center justify-center text-white text-lg font-bold mb-4">
            PA
          </div>
          <h1 className="text-xl font-semibold text-slate-800">PayAdmin</h1>
          <p className="text-slate-400 text-sm">Payment Gateway Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8">
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

        <div className="px-8 py-3 bg-slate-50 border-t border-slate-200 text-center">
          <span className="text-slate-400 text-xs">Authenticated via corporate LDAP</span>
        </div>
      </div>
    </div>
  )
}
