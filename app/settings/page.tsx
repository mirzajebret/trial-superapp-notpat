'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    Shield, Eye, EyeOff, Lock, Unlock, KeyRound, Check, X, Save,
    Palette, Info, Database, RefreshCw, AlertTriangle, ChevronRight,
    ToggleLeft, ToggleRight, Download, Trash2, ShieldCheck, ShieldOff, Settings
} from 'lucide-react'
import {
    getSettings, updateSettings, setLockPassword, clearPassword, hasPassword,
    lockModule, unlockModule, isModuleLocked, ALL_MODULES, type AppSettings,
    type AccentColor
} from '@/lib/settings'

// ─── Types & helpers ─────────────────────────────────────────────────────────

type Tab = 'keamanan' | 'tampilan' | 'data' | 'tentang'

const ACCENT_COLORS: { value: AccentColor; label: string; cls: string }[] = [
    { value: 'blue', label: 'Biru', cls: 'bg-blue-500' },
    { value: 'purple', label: 'Ungu', cls: 'bg-purple-500' },
    { value: 'green', label: 'Hijau', cls: 'bg-emerald-500' },
    { value: 'orange', label: 'Oranye', cls: 'bg-orange-500' },
    { value: 'rose', label: 'Merah', cls: 'bg-rose-500' },
]

const CATEGORY_ORDER = ['Utama', 'Dokumen', 'Tools', 'Client', 'Misc']

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Icon size={16} className="text-slate-600" />
                </div>
                <h2 className="font-semibold text-slate-800 text-sm">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-blue-500' : 'bg-slate-200'}`}
            aria-pressed={checked}
        >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    )
}

// ─── Tab: Keamanan ───────────────────────────────────────────────────────────

function KeamananTab() {
    const [settings, setSettings] = useState<AppSettings | null>(null)
    const [newPwd, setNewPwd] = useState('')
    const [confirmPwd, setConfirmPwd] = useState('')
    const [currentPwd, setCurrentPwd] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showCurrent, setShowCurrent] = useState(false)
    const [pwdStatus, setPwdStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [pwdMessage, setPwdMessage] = useState('')
    const [saving, setSaving] = useState(false)
    const [lockStatus, setLockStatus] = useState<Record<string, boolean>>({})

    useEffect(() => {
        const s = getSettings()
        setSettings(s)
        setLockStatus(s.lockedModules)
    }, [])

    const hasExistingPwd = !!settings?.passwordHash

    const handleSetPassword = async () => {
        if (newPwd.length < 4) {
            setPwdStatus('error'); setPwdMessage('Password minimal 4 karakter.'); return
        }
        if (newPwd !== confirmPwd) {
            setPwdStatus('error'); setPwdMessage('Password tidak cocok.'); return
        }
        setSaving(true)

        // If changing password, verify current first
        if (hasExistingPwd) {
            const { verifyPassword } = await import('@/lib/settings')
            const valid = await verifyPassword(currentPwd)
            if (!valid) {
                setPwdStatus('error'); setPwdMessage('Password saat ini salah.')
                setSaving(false); return
            }
        }

        await setLockPassword(newPwd)
        setPwdStatus('success')
        setPwdMessage(hasExistingPwd ? 'Password berhasil diubah.' : 'Password berhasil dibuat.')
        setNewPwd(''); setConfirmPwd(''); setCurrentPwd('')
        setSettings(getSettings())
        setSaving(false)
        setTimeout(() => { setPwdStatus('idle'); setPwdMessage('') }, 3000)
    }

    const handleClearPassword = () => {
        if (!confirm('Hapus password? Semua modul yang dikunci akan otomatis terbuka.')) return
        clearPassword()
        setSettings(getSettings())
        setLockStatus({})
        setPwdStatus('success'); setPwdMessage('Password dihapus.')
        setTimeout(() => { setPwdStatus('idle'); setPwdMessage('') }, 2500)
    }

    const handleToggleLock = (href: string) => {
        if (!settings?.passwordHash) {
            setPwdStatus('error'); setPwdMessage('Buat password terlebih dahulu sebelum mengunci modul.')
            setTimeout(() => { setPwdStatus('idle'); setPwdMessage('') }, 3000)
            return
        }
        const next = !lockStatus[href]
        if (next) { lockModule(href) } else { unlockModule(href) }
        setLockStatus(prev => ({ ...prev, [href]: next }))
    }

    const lockedCount = Object.values(lockStatus).filter(Boolean).length

    return (
        <div className="space-y-6">
            {/* Password Setup */}
            <SectionCard title="Password Kunci" icon={KeyRound}>
                <div className="space-y-4">
                    <p className="text-sm text-slate-500">
                        {hasExistingPwd
                            ? 'Password sudah diatur. Ubah password atau hapus untuk menonaktifkan semua kunci.'
                            : 'Buat password untuk mengunci modul-modul pilihan Anda.'}
                    </p>

                    {hasExistingPwd && (
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                placeholder="Password saat ini"
                                value={currentPwd}
                                onChange={e => setCurrentPwd(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowCurrent(v => !v)}>
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    )}

                    <div className="relative">
                        <input
                            type={showNew ? 'text' : 'password'}
                            placeholder={hasExistingPwd ? 'Password baru' : 'Buat password'}
                            value={newPwd}
                            onChange={e => setNewPwd(e.target.value)}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowNew(v => !v)}>
                            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Konfirmasi password"
                            value={confirmPwd}
                            onChange={e => setConfirmPwd(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSetPassword() }}
                            className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" onClick={() => setShowConfirm(v => !v)}>
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {pwdStatus !== 'idle' && (
                        <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${pwdStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {pwdStatus === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                            {pwdMessage}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleSetPassword}
                            disabled={saving || !newPwd || !confirmPwd}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                            {hasExistingPwd ? 'Ubah Password' : 'Simpan Password'}
                        </button>
                        {hasExistingPwd && (
                            <button
                                onClick={handleClearPassword}
                                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors border border-red-200 flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Hapus
                            </button>
                        )}
                    </div>

                    {/* Password strength indicator */}
                    {newPwd && (
                        <div className="space-y-1">
                            <div className="flex gap-1">
                                {[4, 6, 8, 12].map((min, i) => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${newPwd.length >= min ? ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'][i] : 'bg-slate-200'}`} />
                                ))}
                            </div>
                            <p className="text-xs text-slate-400">
                                {newPwd.length < 4 ? 'Terlalu pendek' : newPwd.length < 6 ? 'Lemah' : newPwd.length < 8 ? 'Sedang' : newPwd.length < 12 ? 'Kuat' : 'Sangat kuat'}
                            </p>
                        </div>
                    )}
                </div>
            </SectionCard>

            {/* Module Lock List */}
            <SectionCard title={`Kunci Modul ${lockedCount > 0 ? `(${lockedCount} terkunci)` : ''}`} icon={Lock}>
                {!settings?.passwordHash && (
                    <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <span>Atur password terlebih dahulu untuk mengaktifkan kunci modul.</span>
                    </div>
                )}
                <div className="space-y-6">
                    {CATEGORY_ORDER.map(cat => {
                        const modules = ALL_MODULES.filter(m => m.category === cat)
                        return (
                            <div key={cat}>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{cat}</p>
                                <div className="space-y-2">
                                    {modules.map(mod => {
                                        const isLocked = !!lockStatus[mod.href]
                                        return (
                                            <div key={mod.href} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${isLocked ? 'bg-blue-50/70 border-blue-200/80' : 'bg-slate-50 border-slate-200/60 hover:border-slate-300'}`}>
                                                <div className="flex items-center gap-3">
                                                    {isLocked
                                                        ? <Lock size={15} className="text-blue-500 shrink-0" />
                                                        : <Unlock size={15} className="text-slate-400 shrink-0" />}
                                                    <span className={`text-sm font-medium ${isLocked ? 'text-blue-700' : 'text-slate-700'}`}>{mod.name}</span>
                                                </div>
                                                <Toggle checked={isLocked} onChange={() => handleToggleLock(mod.href)} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {lockedCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => {
                                ALL_MODULES.forEach(m => unlockModule(m.href))
                                setLockStatus({})
                            }}
                            className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-2 transition-colors"
                        >
                            <ShieldOff size={14} /> Buka kunci semua modul
                        </button>
                    </div>
                )}
            </SectionCard>
        </div>
    )
}

// ─── Tab: Tampilan ────────────────────────────────────────────────────────────

function TampilanTab() {
    const [settings, setSettings] = useState<AppSettings | null>(null)

    useEffect(() => { setSettings(getSettings()) }, [])

    const handleUpdate = (partial: Partial<AppSettings>) => {
        const next = updateSettings({ ...getSettings(), ...partial })
        setSettings(next)
    }

    if (!settings) return null

    return (
        <div className="space-y-6">
            <SectionCard title="Warna Aksen" icon={Palette}>
                <p className="text-sm text-slate-500 mb-4">Pilih warna aksen untuk elemen aktif di sidebar.</p>
                <div className="flex gap-3 flex-wrap">
                    {ACCENT_COLORS.map(color => (
                        <button
                            key={color.value}
                            onClick={() => handleUpdate({ accentColor: color.value })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${settings.accentColor === color.value ? 'border-slate-800 shadow-md scale-105' : 'border-transparent hover:border-slate-200'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl ${color.cls} shadow-md`} />
                            <span className="text-xs font-medium text-slate-600">{color.label}</span>
                        </button>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Preferensi Tampilan" icon={Settings}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-1">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Sidebar Compact Default</p>
                            <p className="text-xs text-slate-500 mt-0.5">Sidebar otomatis mengecil saat pertama buka</p>
                        </div>
                        <Toggle checked={settings.compactSidebar} onChange={v => handleUpdate({ compactSidebar: v })} />
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between py-1">
                        <div>
                            <p className="text-sm font-medium text-slate-700">Tampilkan Angka Keuangan</p>
                            <p className="text-xs text-slate-500 mt-0.5">Sembunyikan nominal di dashboard untuk privasi</p>
                        </div>
                        <Toggle checked={settings.showFinancials} onChange={v => handleUpdate({ showFinancials: v })} />
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Nama Aplikasi" icon={Settings}>
                <div className="space-y-3">
                    <p className="text-sm text-slate-500">Nama yang ditampilkan di header sidebar.</p>
                    <input
                        type="text"
                        value={settings.appName}
                        onChange={e => handleUpdate({ appName: e.target.value })}
                        maxLength={30}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nama aplikasi..."
                    />
                    <p className="text-xs text-slate-400 text-right">{settings.appName.length}/30</p>
                </div>
            </SectionCard>

            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Reload halaman untuk menerapkan beberapa perubahan tampilan.</span>
            </div>
        </div>
    )
}

// ─── Tab: Data ────────────────────────────────────────────────────────────────

function DataTab() {
    const [storageInfo, setStorageInfo] = useState<{ key: string; size: number }[]>([])
    const [totalSize, setTotalSize] = useState(0)
    const [exportStatus, setExportStatus] = useState<'idle' | 'success'>('idle')

    useEffect(() => {
        if (typeof window === 'undefined') return
        const info: { key: string; size: number }[] = []
        let total = 0
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || ''
            const val = localStorage.getItem(key) || ''
            const size = new Blob([val]).size
            info.push({ key, size })
            total += size
        }
        setStorageInfo(info.sort((a, b) => b.size - a.size))
        setTotalSize(total)
    }, [])

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        return `${(bytes / 1024).toFixed(1)} KB`
    }

    const handleExport = () => {
        const data: Record<string, unknown> = {}
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i) || ''
            try { data[key] = JSON.parse(localStorage.getItem(key) || '') }
            catch { data[key] = localStorage.getItem(key) }
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kantorapp-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        setExportStatus('success')
        setTimeout(() => setExportStatus('idle'), 3000)
    }

    const handleClearSettings = () => {
        if (!confirm('Reset semua pengaturan ke default? (Data modul tidak ter-reset)')) return
        localStorage.removeItem('kantor_settings')
        window.location.reload()
    }

    return (
        <div className="space-y-6">
            <SectionCard title="Penggunaan Storage" icon={Database}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Total localStorage terpakai</span>
                        <span className="font-bold text-slate-800">{formatBytes(totalSize)}</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {storageInfo.map(item => (
                            <div key={item.key} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                                <span className="text-xs text-slate-600 font-mono truncate flex-1 mr-4">{item.key}</span>
                                <span className="text-xs text-slate-400 shrink-0">{formatBytes(item.size)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Ekspor & Reset" icon={Download}>
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-1">Ekspor Semua Data</p>
                            <p className="text-xs text-slate-500">Download semua data localStorage sebagai file JSON backup.</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${exportStatus === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            {exportStatus === 'success' ? <><Check size={16} /> Berhasil!</> : <><Download size={16} /> Export</>}
                        </button>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-700 mb-1">Reset Pengaturan</p>
                            <p className="text-xs text-red-500">Kembalikan semua pengaturan ke default. Data modul tidak terhapus.</p>
                        </div>
                        <button
                            onClick={handleClearSettings}
                            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                            <RefreshCw size={16} /> Reset
                        </button>
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

// ─── Tab: Tentang ─────────────────────────────────────────────────────────────

function TentangTab() {
    return (
        <div className="space-y-6">
            <SectionCard title="Informasi Aplikasi" icon={Info}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Shield size={28} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-white text-lg">KantorApp</p>
                            <p className="text-slate-400 text-sm">Superapp Notaris & PPAT</p>
                            <span className="mt-1 inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">v1.0.0</span>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {[
                            { label: 'Framework', value: 'Next.js 16 (Turbopack)' },
                            { label: 'UI Library', value: 'Tailwind CSS + Lucide' },
                            { label: 'Storage', value: 'localStorage (client-side)' },
                            { label: 'Enkripsi', value: 'SHA-256 (WebCrypto API)' },
                            { label: 'Platform', value: 'Web (Internal Use)' },
                        ].map(row => (
                            <div key={row.label} className="flex justify-between items-center py-3">
                                <span className="text-sm text-slate-500">{row.label}</span>
                                <span className="text-sm font-medium text-slate-700">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Catatan Pengembang" icon={Info}>
                <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                    <p>
                        Aplikasi ini dirancang khusus untuk kebutuhan operasional kantor Notaris &amp; PPAT.
                        Semua data disimpan secara lokal di perangkat ini dan tidak dikirim ke server eksternal.
                    </p>
                    <p>
                        Fitur kunci modul menggunakan algoritma <strong>SHA-256</strong> dari WebCrypto API browser,
                        memastikan password tidak pernah tersimpan dalam bentuk plaintext.
                    </p>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-amber-700 text-xs">
                            Kunci modul bersifat client-side. Pengguna dengan akses langsung ke perangkat masih
                            dapat mengakses data melalui DevTools. Gunakan sebagai proteksi ringan saja.
                        </p>
                    </div>
                </div>
            </SectionCard>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'keamanan', label: 'Keamanan', icon: Shield },
    { id: 'tampilan', label: 'Tampilan', icon: Palette },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'tentang', label: 'Tentang', icon: Info },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('keamanan')

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
            <div className="max-w-screen-lg mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <Settings size={20} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Pengaturan</h1>
                    </div>
                    <p className="text-slate-500 text-sm ml-[52px]">Kelola keamanan, tampilan, dan data aplikasi</p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-52 shrink-0">
                        <nav className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            {TABS.map(tab => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all border-l-2 ${isActive
                                            ? 'bg-blue-50 text-blue-700 border-blue-500'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent'}`}
                                    >
                                        <Icon size={17} />
                                        {tab.label}
                                        {isActive && <ChevronRight size={14} className="ml-auto text-blue-400" />}
                                    </button>
                                )
                            })}
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === 'keamanan' && <KeamananTab />}
                        {activeTab === 'tampilan' && <TampilanTab />}
                        {activeTab === 'data' && <DataTab />}
                        {activeTab === 'tentang' && <TentangTab />}
                    </div>
                </div>
            </div>
        </div>
    )
}
