/**
 * Settings utility — KantorApp Superapp Notaris
 * Persists to localStorage under key "kantor_settings"
 */

export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'rose'

export interface AppSettings {
    /** Map of route path → locked (true = locked) */
    lockedModules: Record<string, boolean>
    /** SHA-256 hex of the lock password */
    passwordHash: string | null
    /** UI accent color */
    accentColor: AccentColor
    /** Use compact/icon-only sidebar by default */
    compactSidebar: boolean
    /** Show financial numbers on dashboard */
    showFinancials: boolean
    /** App display name override */
    appName: string
}

const STORAGE_KEY = 'kantor_settings'

const DEFAULT_SETTINGS: AppSettings = {
    lockedModules: {},
    passwordHash: null,
    accentColor: 'blue',
    compactSidebar: false,
    showFinancials: true,
    appName: 'Notaris & PPAT',
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export function getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_SETTINGS
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
        return DEFAULT_SETTINGS
    }
}

export function saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = getSettings()
    const next = { ...current, ...partial }
    saveSettings(next)
    return next
}

// ─── Password ────────────────────────────────────────────────────────────────

/** SHA-256 hash a string — uses WebCrypto when available, falls back to Node crypto */
export async function hashPassword(password: string): Promise<string> {
    // WebCrypto (browser / secure context)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    }

    // Node.js fallback (SSR / insecure context where crypto.subtle is unavailable)
    const { createHash } = await import('crypto')
    return createHash('sha256').update(password).digest('hex')
}

export async function setLockPassword(password: string): Promise<void> {
    const hash = await hashPassword(password)
    updateSettings({ passwordHash: hash })
}

export async function verifyPassword(input: string): Promise<boolean> {
    const settings = getSettings()
    if (!settings.passwordHash) return false
    const inputHash = await hashPassword(input)
    return inputHash === settings.passwordHash
}

export function hasPassword(): boolean {
    const s = getSettings()
    return !!s.passwordHash
}

export function clearPassword(): void {
    updateSettings({ passwordHash: null, lockedModules: {} })
}

// ─── Module Lock ─────────────────────────────────────────────────────────────

export function isModuleLocked(pathname: string): boolean {
    const settings = getSettings()
    return !!settings.lockedModules[pathname]
}

export function lockModule(pathname: string): void {
    const settings = getSettings()
    saveSettings({
        ...settings,
        lockedModules: { ...settings.lockedModules, [pathname]: true },
    })
}

export function unlockModule(pathname: string): void {
    const settings = getSettings()
    const updated = { ...settings.lockedModules }
    delete updated[pathname]
    saveSettings({ ...settings, lockedModules: updated })
}

export function toggleModuleLock(pathname: string): void {
    if (isModuleLocked(pathname)) {
        unlockModule(pathname)
    } else {
        lockModule(pathname)
    }
}

// ─── All lockable modules ─────────────────────────────────────────────────────

export interface ModuleInfo {
    name: string
    href: string
    category: string
}

export const ALL_MODULES: ModuleInfo[] = [
    // Utama
    { name: 'Invoice', href: '/modules/invoice', category: 'Utama' },
    { name: 'Kwitansi', href: '/modules/kwitansi', category: 'Utama' },
    { name: 'Serah Terima Dokumen', href: '/modules/serah-terima', category: 'Utama' },
    { name: 'Daftar Hadir', href: '/modules/daftar-hadir', category: 'Utama' },
    { name: 'Cover Akta', href: '/modules/cover-akta', category: 'Utama' },
    { name: 'Tracking Pekerjaan', href: '/modules/tracking-pekerjaan', category: 'Utama' },
    { name: 'Daftar & Monitoring Pekerjaan', href: '/modules/daftar-pekerjaan', category: 'Utama' },
    // Dokumen
    { name: 'Laporan Bulanan', href: '/modules/laporan-bulanan', category: 'Dokumen' },
    { name: 'Riwayat Dokumen', href: '/modules/riwayat', category: 'Dokumen' },
    { name: 'Form Badan Usaha', href: '/modules/webform', category: 'Dokumen' },
    { name: 'Manajemen Dokumen', href: '/modules/dokumen-legalitas-badan', category: 'Dokumen' },
    { name: 'Draft Akta', href: '/modules/bank-draft', category: 'Dokumen' },
    // Tools
    { name: 'Penggaris Akta', href: '/modules/penggaris-akta', category: 'Tools' },
    { name: 'Kalkulator Pajak', href: '/modules/kalkulator-pajak', category: 'Tools' },
    // Client
    { name: 'CDD Perorangan', href: '/modules/cdd-perorangan', category: 'Client' },
    { name: 'CDD Korporasi', href: '/modules/cdd-korporasi', category: 'Client' },
    { name: 'Akun Client', href: '/modules/akun-client', category: 'Client' },
    { name: 'WhatsApp Forms', href: '/modules/whatsapp-forms', category: 'Client' },
    // Misc
    { name: 'Laporan Karyawan', href: '/modules/laporan-karyawan', category: 'Misc' },
    { name: 'Sistem Petty Cash', href: '/modules/petty-cash', category: 'Misc' },
    { name: 'Chat Kantor', href: '/modules/chat-kantor', category: 'Misc' },
]
