'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldOff, X, Check } from 'lucide-react'
import { useAuth } from '@/components/AuthContext'

/**
 * Floating toggle for enabling/disabling the login feature.
 * Rendered inside the Dashboard page (client island).
 */
export default function LoginToggleWidget() {
    const { loginEnabled, setLoginEnabled } = useAuth()
    const [confirming, setConfirming] = useState(false)

    const handleClick = () => {
        if (!confirming) {
            setConfirming(true)
            return
        }
    }

    const confirm = () => {
        setLoginEnabled(!loginEnabled)
        setConfirming(false)
    }

    const cancel = () => setConfirming(false)

    return (
        <div className="relative inline-flex items-center">
            {/* Confirm popover */}
            {confirming && (
                <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 flex items-center gap-3 whitespace-nowrap z-50 animate-in fade-in slide-in-from-right-2 duration-200">
                    <span className="text-sm font-medium text-slate-700">
                        {loginEnabled ? 'Nonaktifkan login?' : 'Aktifkan login?'}
                    </span>
                    <button
                        onClick={confirm}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                        <Check size={12} /> Ya
                    </button>
                    <button
                        onClick={cancel}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                        <X size={12} /> Batal
                    </button>
                </div>
            )}

            {/* Main toggle button */}
            <button
                onClick={handleClick}
                title={loginEnabled ? 'Login aktif — klik untuk nonaktifkan' : 'Login nonaktif — klik untuk aktifkan'}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border shadow-sm ${loginEnabled
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                    }`}
            >
                {loginEnabled ? (
                    <>
                        <ShieldCheck size={16} />
                        Login: Aktif
                    </>
                ) : (
                    <>
                        <ShieldOff size={16} />
                        Login: Nonaktif
                    </>
                )}
            </button>
        </div>
    )
}
