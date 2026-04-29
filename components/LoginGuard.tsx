'use client'

import { useAuth } from '@/components/AuthContext'
import LoginScreen from '@/components/LoginScreen'
import type { ReactNode } from 'react'

export default function LoginGuard({ children }: { children: ReactNode }) {
    const { loggedIn, loginEnabled } = useAuth()

    // If login feature is disabled — let everyone through
    if (!loginEnabled) return <>{children}</>

    // If login is enabled but user is not authenticated — show login screen
    if (!loggedIn) return <LoginScreen />

    // Authenticated — render normally
    return <>{children}</>
}
