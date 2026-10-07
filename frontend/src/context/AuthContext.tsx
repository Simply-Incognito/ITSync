import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../services/api'

export interface User {
  id: string
  email: string
  role: 'student' | 'organization_representative' | 'administrator'
  status: 'active' | 'suspended'
  emailVerifiedAt?: string | null
}

export interface StudentProfile {
  _id: string
  fullName: string
  phoneNumber?: string
  institution?: string
  department?: string
  fieldOfStudy?: string
  currentLevel?: string
  expectedDurationWeeks?: number
  preferredLocations?: string[]
  skills?: string[]
}

interface AuthContextType {
  user: User | null
  studentProfile: StudentProfile | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<StudentProfile>) => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  confirmPassword: string
  role: 'student' | 'organization_representative'
  student?: {
    fullName: string
    phoneNumber?: string
    institution?: string
    department?: string
    fieldOfStudy?: string
    currentLevel?: string
    expectedDurationWeeks?: number
    preferredLocations?: string[]
    skills?: string[]
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [token])

  const fetchCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser()
      setUser(response.user)
      if (response.student) {
        setStudentProfile(response.student)
      }
    } catch {
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    setToken(response.accessToken)
    setUser(response.user)
    localStorage.setItem('token', response.accessToken)
  }

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data)
    setToken(response.accessToken)
    setUser(response.user)
    localStorage.setItem('token', response.accessToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setStudentProfile(null)
  }

  const updateProfile = async (data: Partial<StudentProfile>) => {
    if (!token) return
    const response = await authApi.updateStudentProfile(data)
    setStudentProfile(response)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
