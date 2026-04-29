'use client'

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react'
import {
    getCurrentUser,
    isAuthenticated,
    isLoginEnabled,
    loginUser,
    logoutUser,
    setLoginEnabled,
    type AuthUser,
} from '@/lib/auth'

interface AuthContextValue {
    user: AuthUser | null
    loggedIn: boolean
    loginEnabled: boolean
    login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    setLoginEnabled: (enabled: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null)
    const [loginEnabled, setLoginEnabledState] = useState(true)
    const [hydrated, setHydrated] = useState(false)

    // Hydrate from localStorage on mount
    useEffect(() => {
        setUser(getCurrentUser())
        setLoginEnabledState(isLoginEnabled())
        setHydrated(true)
    }, [])

    const login = useCallback(async (userId: string, password: string) => {
        const result = await loginUser(userId, password)
        if (result.success) {
            setUser(result.user)
            return { success: true }
        }
        return { success: false, error: result.error }
    }, [])

    const logout = useCallback(() => {
        logoutUser()
        setUser(null)
    }, [])

    const handleSetLoginEnabled = useCallback((enabled: boolean) => {
        setLoginEnabled(enabled)
        setLoginEnabledState(enabled)
    }, [])

    // Don't render until hydrated to avoid SSR mismatch
    if (!hydrated) return null

    return (
        <AuthContext.Provider
            value={{
                user,
                loggedIn: isAuthenticated(),
                loginEnabled,
                login,
                logout,
                setLoginEnabled: handleSetLoginEnabled,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
