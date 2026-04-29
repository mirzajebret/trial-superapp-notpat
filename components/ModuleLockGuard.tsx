'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react'
import { isModuleLocked, verifyPassword, hasPassword } from '@/lib/settings'

interface ModuleLockGuardProps {
    children: React.ReactNode
}

export default function ModuleLockGuard({ children }: ModuleLockGuardProps) {
    const pathname = usePathname()
    const [locked, setLocked] = useState(false)
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)
    const [checking, setChecking] = useState(true)
    const [unlocked, setUnlocked] = useState(false)

    // Check lock status whenever route changes
    useEffect(() => {
        setChecking(true)
        setUnlocked(false)
        setPassword('')
        setError('')

        // Small delay to allow localStorage to be read client-side
        const timer = setTimeout(() => {
            const moduleLocked = isModuleLocked(pathname)
            const pwdSet = hasPassword()
            setLocked(moduleLocked && pwdSet)
            setChecking(false)
        }, 50)

        return () => clearTimeout(timer)
    }, [pathname])

    const handleUnlock = useCallback(async () => {
        if (!password.trim()) return

        const valid = await verifyPassword(password)
        if (valid) {
            setUnlocked(true)
            setLocked(false)
            setPassword('')
            setError('')
        } else {
            setError('Password salah. Coba lagi.')
            setShake(true)
            setPassword('')
            setTimeout(() => setShake(false), 600)
        }
    }, [password])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleUnlock()
    }

    // Not locked or already unlocked — render children normally
    if (checking) return null
    if (!locked || unlocked) return <>{children}</>

    // Locked — show password overlay
    return (
        <div className="flex-1 min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className={`relative z-10 w-full max-w-md mx-4 ${shake ? 'animate-shake' : ''}`}>
                {/* Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Lock size={36} className="text-blue-400" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Modul Terkunci</h1>
                        <p className="text-slate-400 text-sm">
                            Halaman ini dilindungi. Masukkan password untuk melanjutkan.
                        </p>
                    </div>

                    {/* Input */}
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <KeyRound size={18} />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError('') }}
                                onKeyDown={handleKeyDown}
                                placeholder="Masukkan password..."
                                autoFocus
                                className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                                <ShieldAlert size={16} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Button */}
                        <button
                            onClick={handleUnlock}
                            disabled={!password.trim()}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 disabled:shadow-none text-sm"
                        >
                            Buka Kunci
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-slate-600 text-xs mt-6">
                        Atur password di <span className="text-slate-400 font-medium">Settings → Keamanan</span>
                    </p>
                </div>
            </div>

            <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.6s ease-in-out;
        }
      `}</style>
        </div>
    )
}
