import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  // Listen for session expiry events
  useEffect(() => {
    const handler = () => {
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    window.addEventListener('auth:expired', handler)
    return () => window.removeEventListener('auth:expired', handler)
  }, [])

  const login = useCallback(async (userId, password, expectedRole = null) => {
    // userId can be USN / Aadhaar Number for students, or Username for faculty
    const res = await api.post('/auth/login', {
      user_id: userId,
      username: userId,
      password,
      role: expectedRole,
    })
    const { token, role, full_name, user_id, usn } = res.data
    localStorage.setItem('token', token)
    const userData = { user_id: user_id || userId, username: user_id || userId, role, full_name, usn }
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
