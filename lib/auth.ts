/**
 * Auth utility — KantorApp Superapp Notaris
 * Lightweight localStorage-based auth (experimental).
 *
 * Two hardcoded users:
 *   mirzajebret / miebaso354
 *   admin       / komparisi
 *
 * State keys:
 *   kantor_auth          → { userId, displayName }
 *   kantor_login_enabled → "true" | "false"
 */

const AUTH_KEY = 'kantor_auth'
const LOGIN_ENABLED_KEY = 'kantor_login_enabled'

export interface AuthUser {
    userId: string
    displayName: string
    role: 'user' | 'admin'
}

// ─── Hardcoded users ──────────────────────────────────────────────────────────

const USERS: { id: string; password: string; displayName: string; role: 'user' | 'admin' }[] = [
    { id: 'mirzajebret', password: 'miebaso354', displayName: 'Mirza Jebret', role: 'user' },
    { id: 'admin', password: 'komparisi', displayName: 'Administrator', role: 'admin' },
]

// ─── Auth state ───────────────────────────────────────────────────────────────

export function getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null
    try {
        const raw = localStorage.getItem(AUTH_KEY)
        if (!raw) return null
        return JSON.parse(raw) as AuthUser
    } catch {
        return null
    }
}

export function isAuthenticated(): boolean {
    return getCurrentUser() !== null
}

async function hashPassword(password: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }
    // Node.js / SSR fallback
    const { createHash } = await import('crypto')
    return createHash('sha256').update(password).digest('hex')
}

export async function loginUser(
    userId: string,
    password: string
): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    const found = USERS.find(u => u.id === userId)
    if (!found) {
        return { success: false, error: 'Username tidak ditemukan.' }
    }

    // Compare hashes to avoid timing differences on plain comparison
    const [inputHash, storedHash] = await Promise.all([
        hashPassword(password),
        hashPassword(found.password),
    ])

    if (inputHash !== storedHash) {
        return { success: false, error: 'Password salah.' }
    }

    const user: AuthUser = {
        userId: found.id,
        displayName: found.displayName,
        role: found.role,
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(user))
    return { success: true, user }
}

export function logoutUser(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(AUTH_KEY)
}

// ─── Login enabled toggle ─────────────────────────────────────────────────────

/** Returns true if login is enabled (default: true). */
export function isLoginEnabled(): boolean {
    if (typeof window === 'undefined') return true
    const raw = localStorage.getItem(LOGIN_ENABLED_KEY)
    if (raw === null) return true       // default enabled
    return raw === 'true'
}

export function setLoginEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LOGIN_ENABLED_KEY, String(enabled))
}
