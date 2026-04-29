'use client'

import { useState, type FormEvent } from 'react'
import { Scale, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

export default function LoginScreen() {
    const { login } = useAuth()
    const [userId, setUserId] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!userId.trim() || !password.trim()) {
            setError('Username dan password wajib diisi.')
            return
        }
        setLoading(true)
        setError('')
        const result = await login(userId.trim(), password)
        if (!result.success) {
            setError(result.error ?? 'Login gagal.')
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                {/* Glass card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
                    {/* Logo + Title */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 mb-4">
                            <Scale size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Notaris &amp; PPAT</h1>
                        <p className="text-slate-400 text-sm mt-1">KantorApp — Superapp Notaris</p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 mb-8" />

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={e => { setUserId(e.target.value); setError('') }}
                                placeholder="Masukkan username"
                                autoComplete="username"
                                autoFocus
                                disabled={loading}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError('') }}
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                    className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm animate-in slide-in-from-top-2 duration-200">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Memverifikasi...
                                </span>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer note */}
                    <p className="text-center text-xs text-slate-600 mt-6">
                        Sistem internal — akses terbatas
                    </p>
                </div>
            </div>
        </div>
    )
}
