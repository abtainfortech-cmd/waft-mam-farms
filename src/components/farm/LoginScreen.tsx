'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/store/app'
import { toast } from 'sonner'
import { Bird, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoginScreen() {
  const login = useAppStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        login(data.staff)
        toast.success(`Welcome, ${data.staff.name}!`)
      } else {
        setError(data.error || 'Invalid username or password')
        toast.error('Login failed. Please check your credentials.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl shadow-lg mb-4">
            <Bird className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">WAFT MAM Farms</h1>
          <p className="text-sm text-gray-500 mt-1">and Trading Hub — Management System</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-11"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 h-11"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{error}</p>
              )}

              <Button type="submit" className="w-full h-11 bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Default Credentials Info */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center mb-3">Default Login Credentials</p>
              <div className="grid grid-cols-5 gap-1 text-[10px]">
                {[
                  { role: 'CEO', user: 'ceo', pass: 'ceo123' },
                  { role: 'Sales', user: 'sales', pass: 'sales123' },
                  { role: 'Farm', user: 'farmhand', pass: 'farm123' },
                  { role: 'Accounts', user: 'accountant', pass: 'acc123' },
                  { role: 'Vet', user: 'vet', pass: 'vet123' },
                ].map((c) => (
                  <div key={c.role} className="bg-gray-50 rounded p-1.5 text-center">
                    <p className="font-semibold text-gray-700">{c.role}</p>
                    <p className="text-gray-500">{c.user}</p>
                    <p className="text-gray-400">{c.pass}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-gray-400 mt-4">
          WAFT MAM Farms and Trading Hub
        </p>
      </motion.div>
    </div>
  )
}
