"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Minus,
    Search,
    AlertTriangle,
    Wallet,
    Printer,
    FileText,
    Camera,
    Trash2,
    Settings,
    X,
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    Paperclip,
    Image as ImageIcon,
    Pen,
    StickyNote,
    CalendarRange,
    CheckCircle2
} from 'lucide-react';
import {
    getPettyCashTransactions,
    savePettyCashTransactions,
    getPettyCashSettings,
    savePettyCashSettings,
    uploadPettyCashProof
} from './actions';

type TransactionTypeCategory = 'office-operational' | 'work-handling';

interface Transaction {
    id: string;
    type: 'Debit' | 'Credit';
    transactionType: TransactionTypeCategory;
    date: string;
    category: string;
    nominal: number;
    description: string;
    method: 'Cash' | 'Transfer' | 'QRIS';
    proof?: string;
    flags: {
        urgent: boolean;
        reimburse: boolean;
        relatedToClient: boolean;
    };
    personInCharge: string;
}

interface PettyCashSettings {
    maxLimitPerItem: number;
    lowBalanceThreshold: number;
    categories: string[];
    adminName: string;
}

interface PrintRecord {
    id: string;
    printedAt: string;          // ISO timestamp
    fromDate: string;           // YYYY-MM-DD
    toDate: string;             // YYYY-MM-DD
    label: string;              // "1 Jan – 9 Mar 2026"
    transactionType: TransactionTypeCategory;
}

const PRINT_RECORDS_KEY = 'petty-cash-print-records';

function formatDateLabel(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Category Lists per Transaction Type
const CATEGORIES_OFFICE_OPERATIONAL = [
    'ATK & Supplies',
    'Utilities (Listrik, Air, Internet)',
    'Transportasi',
    'Konsumsi & Rapat',
    'Pemeliharaan Kantor',
    'Kebersihan',
    'Lain-lain'
];

const CATEGORIES_WORK_HANDLING = [
    'Biaya Notaris',
    'Biaya Pejabat',
    'Legalisir & Pengesahan',
    'Transportasi Klien',
    'Biaya Administrasi',
    'Biaya Pengiriman',
    'Lain-lain'
];

type ModalType = 'expense-operational' | 'expense-work' | 'income' | null;

// --- Attachment Modal Component ---
function AttachmentModal({
    isOpen,
    onClose,
    currentUrl,
    onUpload,
    onRemove,
    title,
    uploading
}: {
    isOpen: boolean;
    onClose: () => void;
    currentUrl?: string;
    onUpload: (file: File) => Promise<void>;
    onRemove: () => void;
    title: string;
    uploading: boolean;
}) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Paperclip size={16} className="text-blue-600" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 hover:bg-gray-200 transition">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6">
                    {uploading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500">
                            <Loader2 className="animate-spin text-blue-600" size={32} />
                            <p className="text-xs font-medium">Mengupload bukti...</p>
                        </div>
                    ) : currentUrl ? (
                        <div className="space-y-4">
                            {currentUrl.toLowerCase().endsWith('.pdf') ? (
                                <div className="aspect-video bg-red-50 rounded-lg border border-red-100 flex flex-col items-center justify-center gap-3">
                                    <FileText className="w-16 h-16 text-red-500" />
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-red-700">Dokumen PDF</p>
                                        <a
                                            href={currentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline mt-1 block"
                                        >
                                            Klik untuk membuka
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                                    <img
                                        src={currentUrl}
                                        alt="Bukti Transaksi"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <a
                                            href={currentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white/90 text-gray-800 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm hover:bg-white"
                                        >
                                            Buka Gambar
                                        </a>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={onRemove}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Hapus
                                </button>
                                <label className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) onUpload(file);
                                        }}
                                    />
                                    <div className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2 cursor-pointer">
                                        <ImageIcon size={14} /> Ganti
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition group">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                                        <ImageIcon className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-gray-700 font-medium">Klik untuk upload file</p>
                                    <p className="text-[10px] text-gray-500">Gambar atau PDF (Max. 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) onUpload(file);
                                    }}
                                />
                            </label>
                            <div className="text-[10px] text-gray-400 text-center px-4">
                                Belum ada bukti transaksi yang dilampirkan.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const App = () => {
    // --- State ---
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<PettyCashSettings>({
        maxLimitPerItem: 900000000,
        lowBalanceThreshold: 500000,
        categories: [],
        adminName: 'Admin'
    });

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeModalType, setActiveModalType] = useState<ModalType>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTransactionType, setActiveTransactionType] = useState<TransactionTypeCategory>('office-operational');

    // Print Report State
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [printRecords, setPrintRecords] = useState<PrintRecord[]>([]);
    const [printRange, setPrintRange] = useState({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    // Attachment Modal State
    const [attachmentModalState, setAttachmentModalState] = useState<{
        isOpen: boolean;
        transactionId?: string;
        currentUrl?: string;
        title: string;
    }>({ isOpen: false, title: '' });
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Transaction>>({
        type: 'Credit',
        transactionType: 'office-operational',
        date: new Date().toISOString().split('T')[0],
        category: 'Lain-lain',
        nominal: 0,
        description: '',
        method: 'Cash',
        flags: { urgent: false, reimburse: false, relatedToClient: false },
        proof: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // --- Load Data ---
    useEffect(() => {
        async function loadData() {
            try {
                const [savedTransactions, savedSettings] = await Promise.all([
                    getPettyCashTransactions(),
                    getPettyCashSettings()
                ]);
                setTransactions(savedTransactions);
                setSettings(savedSettings);
            } catch (error) {
                console.error("Gagal memuat data Petty Cash", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
        // Load print records from localStorage
        try {
            const stored = localStorage.getItem(PRINT_RECORDS_KEY);
            if (stored) setPrintRecords(JSON.parse(stored));
        } catch { }
    }, []);

    // --- Computations ---
    const stats = useMemo(() => {
        // Separate stats by transaction type
        const filteredByType = transactions.filter(t => t.transactionType === activeTransactionType);

        const totalIn = filteredByType
            .filter(t => t.type === 'Debit')
            .reduce((acc, curr) => acc + curr.nominal, 0);

        const totalOut = filteredByType
            .filter(t => t.type === 'Credit')
            .reduce((acc, curr) => acc + curr.nominal, 0);

        const currentBalance = totalIn - totalOut;

        return {
            totalIn,
            totalOut,
            currentBalance,
            isLow: currentBalance <= settings.lowBalanceThreshold
        };
    }, [transactions, settings, activeTransactionType]);

    const filteredTransactions = transactions.filter(t => {
        const matchType = t.transactionType === activeTransactionType;
        const matchSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const runningBalanceMap = useMemo(() => {
        const sorted = [...filteredTransactions].reverse();
        const map = new Map<string, number>();
        let balance = 0;
        for (const t of sorted) {
            balance += t.type === 'Debit' ? t.nominal : -t.nominal;
            map.set(t.id, balance);
        }
        return map;
    }, [filteredTransactions]);

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nominal || formData.nominal <= 0) return;

        // Proteksi pengeluaran melebihi limit (hanya untuk pengeluaran/Credit)
        if (formData.type === 'Credit' && formData.nominal > settings.maxLimitPerItem) {
            alert(`Peringatan: Transaksi Kredit melebihi batas (Rp ${settings.maxLimitPerItem.toLocaleString()})`);
            return;
        }

        let proofUrl = '';
        if (selectedFile) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', selectedFile);
            const uploadRes = await uploadPettyCashProof(formDataUpload);
            if (uploadRes.success && uploadRes.fileUrl) {
                proofUrl = uploadRes.fileUrl;
            }
        }

        const newEntry: Transaction = {
            id: `trx-${Date.now()}`,
            type: formData.type as 'Debit' | 'Credit',
            transactionType: formData.transactionType as TransactionTypeCategory,
            date: formData.date || '',
            category: formData.category || 'Lain-lain',
            nominal: Number(formData.nominal),
            description: formData.description || '',
            method: formData.method as any,
            flags: formData.flags || { urgent: false, reimburse: false, relatedToClient: false },
            personInCharge: settings.adminName,
            proof: proofUrl || formData.proof
        };

        const updatedTransactions = [newEntry, ...transactions];
        setTransactions(updatedTransactions);
        await savePettyCashTransactions(updatedTransactions);

        setIsModalOpen(false);
        // Reset Form
        setFormData({
            type: 'Credit',
            transactionType: activeTransactionType,
            date: new Date().toISOString().split('T')[0],
            category: 'Lain-lain',
            nominal: 0,
            description: '',
            method: 'Cash',
            flags: { urgent: false, reimburse: false, relatedToClient: false },
        });
        setSelectedFile(null);
    };

    const deleteTransaction = async (id: string) => {
        if (confirm('Hapus catatan transaksi ini?')) {
            const updated = transactions.filter(t => t.id !== id);
            setTransactions(updated);
            await savePettyCashTransactions(updated);
        }
    };

    const saveMasterSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        await savePettyCashSettings(settings);
        setIsSettingsOpen(false);
    };

    // --- Print Handlers ---
    const handleOpenPrintModal = () => {
        setPrintRange({
            from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0]
        });
        setIsPrintModalOpen(true);
    };

    const handleExecutePrint = () => {
        const record: PrintRecord = {
            id: `pr-${Date.now()}`,
            printedAt: new Date().toISOString(),
            fromDate: printRange.from,
            toDate: printRange.to,
            label: `${formatDateLabel(printRange.from)} – ${formatDateLabel(printRange.to)}`,
            transactionType: activeTransactionType
        };
        const updated = [record, ...printRecords];
        setPrintRecords(updated);
        try { localStorage.setItem(PRINT_RECORDS_KEY, JSON.stringify(updated)); } catch { }
        setIsPrintModalOpen(false);
        setTimeout(() => window.print(), 100);
    };

    const printRangeTransactions = useMemo(() => {
        const from = new Date(printRange.from);
        const to = new Date(printRange.to);
        to.setHours(23, 59, 59);
        return transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.transactionType === activeTransactionType && d >= from && d <= to;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .reverse();
    }, [transactions, printRange, activeTransactionType]);

    const openingBalance = useMemo(() => {
        const from = new Date(printRange.from);
        return transactions
            .filter(t => {
                const d = new Date(t.date);
                return t.transactionType === activeTransactionType && d < from;
            })
            .reduce((acc, t) => acc + (t.type === 'Debit' ? t.nominal : -t.nominal), 0);
    }, [transactions, printRange.from, activeTransactionType]);

    const printRangeWithBalance = useMemo(() => {
        let balance = openingBalance;
        return printRangeTransactions.map(t => {
            balance += t.type === 'Debit' ? t.nominal : -t.nominal;
            return { ...t, runningBalance: balance };
        });
    }, [printRangeTransactions, openingBalance]);

    const printStats = useMemo(() => {
        const totalIn = printRangeTransactions.filter(t => t.type === 'Debit').reduce((s, t) => s + t.nominal, 0);
        const totalOut = printRangeTransactions.filter(t => t.type === 'Credit').reduce((s, t) => s + t.nominal, 0);
        return { totalIn, totalOut, balance: totalIn - totalOut };
    }, [printRangeTransactions]);

    // --- Attachment Handlers ---
    const handleOpenAttachment = (transactionId: string, currentUrl?: string, title?: string) => {
        setAttachmentModalState({
            isOpen: true,
            transactionId,
            currentUrl,
            title: title || 'Lampiran Bukti Transaksi'
        });
    };

    const handleUploadAttachment = async (file: File) => {
        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const result = await uploadPettyCashProof(formDataUpload);

        if (result.success && result.fileUrl) {
            // Update the transaction with new attachment URL
            const updatedTransactions = transactions.map(t => {
                if (t.id === attachmentModalState.transactionId) {
                    return { ...t, proof: result.fileUrl };
                }
                return t;
            });
            setTransactions(updatedTransactions);
            await savePettyCashTransactions(updatedTransactions);

            // Update modal state to show new file
            setAttachmentModalState(prev => ({ ...prev, currentUrl: result.fileUrl }));
        }
        setIsUploading(false);
    };

    const handleRemoveAttachment = async () => {
        const updatedTransactions = transactions.map(t => {
            if (t.id === attachmentModalState.transactionId) {
                const { proof, ...rest } = t;
                return rest as Transaction;
            }
            return t;
        });
        setTransactions(updatedTransactions);
        await savePettyCashTransactions(updatedTransactions);
        setAttachmentModalState(prev => ({ ...prev, currentUrl: undefined }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                <p className="text-gray-400 text-sm">Menyiapkan buku kas...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-slate-900">

            {/* Header - Hidden on Print */}
            <div className="print:hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <Wallet className="w-7 h-7 text-blue-600" /> SISTEM PETTY CASH
                        </h1>
                        <p className="text-gray-500 text-sm">Manajemen arus kas kecil kantor Notaris & PPAT.</p>
                    </div>

                    {/* Toggle Transaction Type */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTransactionType('office-operational')}
                            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTransactionType === 'office-operational'
                                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Petty Cash Operasional
                        </button>
                        <button
                            onClick={() => setActiveTransactionType('work-handling')}
                            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${activeTransactionType === 'work-handling'
                                ? 'bg-white text-orange-700 shadow-sm ring-1 ring-gray-200'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Biaya Penanganan Pekerjaan
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
                            title="Pengaturan Master"
                        >
                            <Settings className="w-5 h-5 text-gray-400" />
                        </button>
                        <button
                            onClick={handleOpenPrintModal}
                            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
                            title="Buat Laporan"
                        >
                            <Printer className="w-5 h-5 text-gray-400" />
                        </button>
                        {/* Contextual Add Button based on active transaction type */}
                        {activeTransactionType === 'office-operational' ? (
                            <button
                                onClick={() => {
                                    setFormData({
                                        type: 'Credit',
                                        transactionType: 'office-operational',
                                        date: new Date().toISOString().split('T')[0],
                                        category: CATEGORIES_OFFICE_OPERATIONAL[0],
                                        nominal: 0,
                                        description: '',
                                        method: 'Cash',
                                        flags: { urgent: false, reimburse: false, relatedToClient: false },
                                    });
                                    setActiveModalType('expense-operational');
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-md font-bold text-sm"
                            >
                                <Plus className="w-5 h-5" /> Tambah Pengeluaran
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setFormData({
                                        type: 'Credit',
                                        transactionType: 'work-handling',
                                        date: new Date().toISOString().split('T')[0],
                                        category: CATEGORIES_WORK_HANDLING[0],
                                        nominal: 0,
                                        description: '',
                                        method: 'Cash',
                                        flags: { urgent: false, reimburse: false, relatedToClient: false },
                                    });
                                    setActiveModalType('expense-work');
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2 shadow-md font-bold text-sm"
                            >
                                <Plus className="w-5 h-5" /> Tambah Biaya Pekerjaan
                            </button>
                        )}
                    </div>
                </div>

                {/* Warning Alert */}
                {stats.isLow && (
                    <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-2xl flex items-center gap-4 animate-pulse">
                        <div className="p-2 bg-amber-500 rounded-full">
                            <AlertTriangle className="text-white w-4 h-4" />
                        </div>
                        <div>
                            <p className="font-bold text-amber-800 text-sm">⚠️ Saldo Kas Kritis</p>
                            <p className="text-amber-700 text-xs">Sisa saldo Rp {stats.currentBalance.toLocaleString()}. Segera lakukan pengisian (Debit).</p>
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saldo Akhir</p>
                        <p className={`text-2xl font-black ${stats.isLow ? 'text-red-600' : 'text-blue-600'}`}>
                            Rp {stats.currentBalance.toLocaleString()}
                        </p>
                        <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${stats.isLow ? 'bg-red-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min((stats.currentBalance / 5000000) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pemasukan (Debit)</p>
                            <button
                                onClick={() => setActiveModalType('income')}
                                className="p-1 hover:bg-green-50 rounded transition-colors group"
                                title="Kelola Pemasukan"
                            >
                                <Pen className="w-3 h-3 text-gray-400 group-hover:text-green-600 transition-colors" />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                            <p className="text-xl font-bold text-green-600">Rp {stats.totalIn.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pengeluaran (Kredit)</p>
                        <div className="flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4 text-red-500" />
                            <p className="text-xl font-bold text-red-600">Rp {stats.totalOut.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* List Table */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-12">
                    <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" /> Riwayat Transaksi
                        </h2>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Cari deskripsi atau kategori..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Tanggal</th>
                                    <th className="px-6 py-4">Kategori</th>
                                    <th className="px-6 py-4">Keterangan</th>
                                    <th className="px-6 py-4">Nominal</th>
                                    <th className="px-6 py-4">Sisa</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {(() => {
                                    // Build sticky note markers: for each print record, mark the fromDate
                                    const stickyMap = new Map<string, PrintRecord[]>();
                                    printRecords
                                        .filter(pr => pr.transactionType === activeTransactionType)
                                        .forEach(pr => {
                                            const key = pr.fromDate;
                                            if (!stickyMap.has(key)) stickyMap.set(key, []);
                                            stickyMap.get(key)!.push(pr);
                                        });

                                    const rows: React.ReactNode[] = [];
                                    filteredTransactions.forEach((t) => {
                                        // Insert sticky note(s) ONCE before the first row whose date matches a print fromDate
                                        if (stickyMap.has(t.date)) {
                                            stickyMap.get(t.date)!.forEach(pr => {
                                                rows.push(
                                                    <tr key={`sticky-${pr.id}`} className="bg-amber-50 border-y border-amber-200">
                                                        <td colSpan={7} className="px-6 py-2.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5 text-amber-700">
                                                                    <StickyNote className="w-3.5 h-3.5" />
                                                                    <span className="text-[11px] font-black uppercase tracking-wider">Pernah Dicetak</span>
                                                                </div>
                                                                <span className="text-[11px] text-amber-600 font-semibold">Periode: {pr.label}</span>
                                                                <span className="text-[10px] text-amber-500 ml-auto">
                                                                    🖨️ {new Date(pr.printedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} pukul {new Date(pr.printedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                            // Remove so subsequent transactions on the same date don't re-insert the same sticky notes
                                            stickyMap.delete(t.date);
                                        }

                                        rows.push(
                                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    {t.type === 'Debit' ? (
                                                        <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px] uppercase bg-green-50 px-2 py-1 rounded-lg w-fit">
                                                            <Plus className="w-3 h-3" /> Debit
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] uppercase bg-red-50 px-2 py-1 rounded-lg w-fit">
                                                            <Minus className="w-3 h-3" /> Kredit
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{t.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-600">{t.category}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenAttachment(t.id, t.proof, `Bukti: ${t.category}`);
                                                            }}
                                                            className={`p-1 rounded transition-colors ${t.proof ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                                                            title={t.proof ? 'Lihat Bukti' : 'Upload Bukti'}
                                                        >
                                                            <Paperclip className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-700">{t.description}</span>
                                                        <div className="flex gap-2 mt-1">
                                                            {t.flags.urgent && <span className="text-[9px] font-bold text-red-500 uppercase">Urgent</span>}
                                                            {t.flags.relatedToClient && <span className="text-[9px] font-bold text-blue-500 uppercase">Klien</span>}
                                                            {t.flags.reimburse && <span className="text-[9px] font-bold text-orange-500 uppercase">Reimburse</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-black text-lg ${t.type === 'Debit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {t.type === 'Debit' ? '+' : '-'} Rp {t.nominal.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-bold text-sm ${(runningBalanceMap.get(t.id) ?? 0) >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
                                                        Rp {(runningBalanceMap.get(t.id) ?? 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => deleteTransaction(t.id)}
                                                        className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    });

                                    if (filteredTransactions.length === 0) {
                                        rows.push(
                                            <tr key="empty">
                                                <td colSpan={7} className="px-6 py-20 text-center text-gray-300 italic">
                                                    Belum ada catatan transaksi.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    return rows;
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- EXPENSE MODAL - OFFICE OPERATIONAL --- */}
            {
                activeModalType === 'expense-operational' && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
                                <div>
                                    <h3 className="font-black text-xl tracking-tight text-blue-900">Pengeluaran Operasional</h3>
                                    <p className="text-blue-600 text-xs">Catat pengeluaran untuk operasi kantor</p>
                                </div>
                                <button onClick={() => setActiveModalType(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-300" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</label>
                                        <input type="date" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            {CATEGORIES_OFFICE_OPERATIONAL.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nominal Pengeluaran (Rp)</label>
                                    <input
                                        type="number" required placeholder="0"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 font-black text-2xl text-red-600 focus:ring-red-100"
                                        value={formData.nominal || ''}
                                        onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi / Peruntukan</label>
                                    <textarea required placeholder="Tulis rincian pengeluaran..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-red-500 transition-colors">
                                        <input type="checkbox" className="rounded-md border-gray-300 text-red-600" checked={formData.flags?.urgent} onChange={(e) => setFormData({ ...formData, flags: { ...formData.flags!, urgent: e.target.checked } })} /> Urgent
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-orange-500 transition-colors col-span-2">
                                        <input type="checkbox" className="rounded-md border-gray-300 text-orange-600" checked={formData.flags?.reimburse} onChange={(e) => setFormData({ ...formData, flags: { ...formData.flags!, reimburse: e.target.checked } })} /> Tagih sebagai Reimburse
                                    </label>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti Transaksi (Gambar/PDF)</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelectedFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            {selectedFile ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                                        {selectedFile.type.includes('pdf') ? (
                                                            <FileText className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-green-600">{selectedFile.name}</p>
                                                    <p className="text-[10px] text-gray-400">Klik untuk mengganti file</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Camera className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500">
                                                        Klik untuk upload gambar atau PDF
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">Max. 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 bg-red-600 hover:bg-red-700 shadow-red-200"
                                >
                                    SIMPAN PENGELUARAN
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* --- EXPENSE MODAL - WORK HANDLING --- */}
            {
                activeModalType === 'expense-work' && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                                <div>
                                    <h3 className="font-black text-xl tracking-tight text-orange-900">Biaya Penanganan Pekerjaan</h3>
                                    <p className="text-orange-600 text-xs">Catat biaya untuk penanganan pekerjaan klien</p>
                                </div>
                                <button onClick={() => setActiveModalType(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-300" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</label>
                                        <input type="date" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            {CATEGORIES_WORK_HANDLING.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nominal Biaya (Rp)</label>
                                    <input
                                        type="number" required placeholder="0"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 font-black text-2xl text-red-600 focus:ring-red-100"
                                        value={formData.nominal || ''}
                                        onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi / Peruntukan</label>
                                    <textarea required placeholder="Tulis rincian biaya pekerjaan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm h-24 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl grid grid-cols-2 gap-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-red-500 transition-colors">
                                        <input type="checkbox" className="rounded-md border-gray-300 text-red-600" checked={formData.flags?.urgent} onChange={(e) => setFormData({ ...formData, flags: { ...formData.flags!, urgent: e.target.checked } })} /> Urgent
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-blue-500 transition-colors">
                                        <input type="checkbox" className="rounded-md border-gray-300 text-blue-600" checked={formData.flags?.relatedToClient} onChange={(e) => setFormData({ ...formData, flags: { ...formData.flags!, relatedToClient: e.target.checked } })} /> Klien / Akta
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer hover:text-orange-500 transition-colors col-span-2">
                                        <input type="checkbox" className="rounded-md border-gray-300 text-orange-600" checked={formData.flags?.reimburse} onChange={(e) => setFormData({ ...formData, flags: { ...formData.flags!, reimburse: e.target.checked } })} /> Tagih sebagai Reimburse
                                    </label>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti Transaksi (Gambar/PDF)</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors relative">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setSelectedFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <div className="flex flex-col items-center gap-2">
                                            {selectedFile ? (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                                        {selectedFile.type.includes('pdf') ? (
                                                            <FileText className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-green-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-green-600">{selectedFile.name}</p>
                                                    <p className="text-[10px] text-gray-400">Klik untuk mengganti file</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Camera className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-500">
                                                        Klik untuk upload gambar atau PDF
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">Max. 5MB</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 bg-red-600 hover:bg-red-700 shadow-red-200"
                                >
                                    SIMPAN BIAYA PEKERJAAN
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* --- INCOME MANAGEMENT MODAL --- */}
            {
                activeModalType === 'income' && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
                                <div>
                                    <h3 className="font-black text-xl tracking-tight text-green-900">Kelola Pemasukan (Debit)</h3>
                                    <p className="text-green-600 text-xs">Tambah, edit, atau hapus transaksi pemasukan</p>
                                </div>
                                <button onClick={() => setActiveModalType(null)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-300" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto">
                                {/* Add New Income Button */}
                                <div className="mb-6">
                                    <button
                                        onClick={() => {
                                            setFormData({
                                                type: 'Debit',
                                                transactionType: activeTransactionType,
                                                date: new Date().toISOString().split('T')[0],
                                                category: 'Pemasukan',
                                                nominal: 0,
                                                description: '',
                                                method: 'Transfer',
                                                flags: { urgent: false, reimburse: false, relatedToClient: false },
                                            });
                                            setIsModalOpen(true);
                                            setActiveModalType(null);
                                        }}
                                        className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-md font-bold text-sm"
                                    >
                                        <Plus className="w-5 h-5" /> Tambah Pemasukan Baru
                                    </button>
                                </div>

                                {/* List of Debit Transactions */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Daftar Pemasukan</h4>

                                    {transactions.filter(t => t.type === 'Debit').length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-400 text-sm">Belum ada transaksi pemasukan</p>
                                        </div>
                                    ) : (
                                        transactions
                                            .filter(t => t.type === 'Debit')
                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                            .map(tx => (
                                                <div key={tx.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${tx.transactionType === 'office-operational' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                    {tx.transactionType === 'office-operational' ? 'OPERASIONAL' : 'PEKERJAAN'}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-1">{tx.description}</p>
                                                            <p className="text-lg font-black text-green-600">Rp {tx.nominal.toLocaleString()}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    setFormData(tx);
                                                                    setIsModalOpen(true);
                                                                    setActiveModalType(null);
                                                                }}
                                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                                                title="Edit"
                                                            >
                                                                <Pen className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('Hapus transaksi pemasukan ini?')) {
                                                                        const updated = transactions.filter(t => t.id !== tx.id);
                                                                        setTransactions(updated);
                                                                        savePettyCashTransactions(updated);
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* --- GENERAL TRANSACTION MODAL (for editing existing or adding income) --- */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="font-black text-xl tracking-tight">{formData.id ? 'Edit Transaksi' : 'Tambah Pemasukan'}</h3>
                                    <p className="text-gray-400 text-xs">{formData.id ? 'Update data transaksi' : 'Catat pemasukan baru'}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-300" />
                                </button>
                            </div>

                            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal</label>
                                        <input type="date" required className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Jenis</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold" value={formData.transactionType} onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as TransactionTypeCategory })}>
                                            <option value="office-operational">Operasional</option>
                                            <option value="work-handling">Pekerjaan</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nominal Pemasukan (Rp)</label>
                                    <input
                                        type="number" required placeholder="0"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 font-black text-2xl text-green-600 focus:ring-green-100"
                                        value={formData.nominal || ''}
                                        onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deskripsi / Sumber</label>
                                    <textarea required placeholder="Tulis sumber pemasukan..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm h-24 resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 bg-green-600 hover:bg-green-700 shadow-green-200"
                                >
                                    {formData.id ? 'UPDATE PEMASUKAN' : 'SIMPAN PEMASUKAN'}
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* --- MODAL MASTER SETTINGS --- */}
            {
                isSettingsOpen && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="font-black text-lg">Master Petty Cash</h3>
                                <button onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5 text-gray-300" /></button>
                            </div>
                            <form onSubmit={saveMasterSettings} className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Limit Keluar per Item</label>
                                    <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.maxLimitPerItem} onChange={(e) => setSettings({ ...settings, maxLimitPerItem: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ambangkan Saldo Rendah</label>
                                    <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl" value={settings.lowBalanceThreshold} onChange={(e) => setSettings({ ...settings, lowBalanceThreshold: Number(e.target.value) })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin / Notaris</label>
                                    <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold" value={settings.adminName} onChange={(e) => setSettings({ ...settings, adminName: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black mt-4">Simpan Konfigurasi</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* --- PRINT MODAL --- */}
            {isPrintModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="p-7 border-b border-gray-100 bg-gradient-to-br from-slate-900 to-slate-700 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                                        <Printer className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="font-black text-lg text-white tracking-tight">Buat Laporan</h3>
                                </div>
                                <p className="text-slate-400 text-xs ml-10">Pilih rentang tanggal laporan yang ingin dicetak</p>
                            </div>
                            <button onClick={() => setIsPrintModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        <div className="p-7 space-y-5">
                            {/* Date Range Inputs */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <CalendarRange className="w-3 h-3" /> Dari Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={printRange.from}
                                        onChange={e => setPrintRange(p => ({ ...p, from: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <CalendarRange className="w-3 h-3" /> S/D Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={printRange.to}
                                        onChange={e => setPrintRange(p => ({ ...p, to: e.target.value }))}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Preview Stats */}
                            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-5 space-y-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preview Laporan</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Jumlah Transaksi</span>
                                    <span className="font-black text-slate-900">{printRangeTransactions.length} transaksi</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Total Debit</span>
                                    <span className="font-bold text-green-600">Rp {printStats.totalIn.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Total Kredit</span>
                                    <span className="font-bold text-red-600">Rp {printStats.totalOut.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                                    <span className="text-xs font-black text-gray-600 uppercase">Saldo Periode</span>
                                    <span className={`font-black text-lg ${printStats.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                                        Rp {printStats.balance.toLocaleString()}
                                    </span>
                                </div>
                                {printRangeTransactions.length === 0 && (
                                    <p className="text-center text-xs text-gray-400 italic pt-1">Tidak ada transaksi dalam rentang ini</p>
                                )}
                            </div>

                            {/* Kategori laporan */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 px-4 py-2.5 rounded-xl">
                                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                                <span>Kategori: <strong className="text-slate-700">{activeTransactionType === 'office-operational' ? 'Petty Cash Operasional' : 'Biaya Penanganan Pekerjaan'}</strong></span>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setIsPrintModalOpen(false)}
                                    className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleExecutePrint}
                                    disabled={printRangeTransactions.length === 0}
                                    className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
                                >
                                    <Printer className="w-4 h-4" /> Cetak Laporan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PRINT TEMPLATE --- */}
            <div className="hidden print:block text-slate-900" style={{ fontFamily: "'Times New Roman', Times, serif", fontSize: '11px' }}>

                {/* Letterhead */}
                <div style={{ borderBottom: '2.5px double #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#0f172a' }}>
                            LAPORAN KAS KECIL (PETTY CASH)
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>
                            Kantor Notaris &amp; PPAT Havis Akbar, S.H., M.Kn.
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                            {activeTransactionType === 'office-operational' ? 'Petty Cash Operasional Kantor' : 'Biaya Penanganan Pekerjaan / Klien'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', fontSize: '9px', color: '#475569' }}>
                        <div>
                            <span style={{ fontWeight: 700 }}>Periode:</span> {formatDateLabel(printRange.from)} s/d {formatDateLabel(printRange.to)}
                        </div>
                        <div>
                            <span style={{ fontWeight: 700 }}>Saldo Awal Periode:</span> Rp {openingBalance.toLocaleString()}
                        </div>
                        <div>
                            <span style={{ fontWeight: 700 }}>Dicetak:</span> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pkl. {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: 'white' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '24px' }}>No</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '70px' }}>Tanggal</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '50px' }}>Jenis</th>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900 }}>Kategori &amp; Keterangan</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '90px' }}>Debit (Masuk)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '90px' }}>Kredit (Keluar)</th>
                            <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 900, width: '90px' }}>Sisa Saldo</th>
                        </tr>
                        {/* Opening balance row */}
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                            <td colSpan={6} style={{ padding: '5px 8px', fontSize: '9px', fontWeight: 700, color: '#475569', fontStyle: 'italic' }}>
                                Saldo Awal (s/d {formatDateLabel(new Date(new Date(printRange.from).getTime() - 86400000).toISOString().split('T')[0])})
                            </td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', fontSize: '9px', fontWeight: 900, color: openingBalance >= 0 ? '#0f172a' : '#dc2626' }}>
                                Rp {openingBalance.toLocaleString()}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {printRangeWithBalance.map((t, idx) => (
                            <tr key={t.id} style={{ background: idx % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '5px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 700, fontSize: '9px' }}>{idx + 1}</td>
                                <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', color: '#475569', fontSize: '9px' }}>
                                    {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ padding: '5px 8px' }}>
                                    <span style={{ fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '3px', background: t.type === 'Debit' ? '#dcfce7' : '#fee2e2', color: t.type === 'Debit' ? '#15803d' : '#b91c1c' }}>
                                        {t.type === 'Debit' ? 'Debit' : 'Kredit'}
                                    </span>
                                </td>
                                <td style={{ padding: '5px 8px' }}>
                                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '10px' }}>{t.category}</div>
                                    <div style={{ fontSize: '8.5px', color: '#64748b', marginTop: '1px' }}>{t.description}</div>
                                    {(t.flags.urgent || t.flags.reimburse || t.flags.relatedToClient) && (
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                            {t.flags.urgent && <span style={{ fontSize: '7px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', border: '1px solid #fca5a5', padding: '0 3px', borderRadius: '2px' }}>URGENT</span>}
                                            {t.flags.reimburse && <span style={{ fontSize: '7px', fontWeight: 900, color: '#f97316', textTransform: 'uppercase', border: '1px solid #fdba74', padding: '0 3px', borderRadius: '2px' }}>REIMBURSE</span>}
                                            {t.flags.relatedToClient && <span style={{ fontSize: '7px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', border: '1px solid #93c5fd', padding: '0 3px', borderRadius: '2px' }}>AKTA/KLIEN</span>}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: t.type === 'Debit' ? '#16a34a' : '#94a3b8', fontSize: '10px' }}>
                                    {t.type === 'Debit' ? `Rp ${t.nominal.toLocaleString()}` : '—'}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700, color: t.type === 'Credit' ? '#dc2626' : '#94a3b8', fontSize: '10px' }}>
                                    {t.type === 'Credit' ? `Rp ${t.nominal.toLocaleString()}` : '—'}
                                </td>
                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900, color: t.runningBalance >= 0 ? '#0f172a' : '#dc2626', fontSize: '10px' }}>
                                    Rp {t.runningBalance.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {printRangeWithBalance.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                                    Tidak ada transaksi dalam periode ini.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Footer info */}
                <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '8.5px', color: '#64748b' }}>
                    <div>
                        <span style={{ fontWeight: 700 }}>Total Transaksi:</span> {printRangeTransactions.length} (Debit: {printRangeTransactions.filter(t => t.type === 'Debit').length}, Kredit: {printRangeTransactions.filter(t => t.type === 'Credit').length})
                    </div>
                    <div>
                        <span style={{ fontWeight: 700 }}>Saldo Akhir Periode:</span>&nbsp;
                        <span style={{ fontWeight: 900, color: (openingBalance + printStats.totalIn - printStats.totalOut) >= 0 ? '#15803d' : '#dc2626' }}>
                            Rp {(openingBalance + printStats.totalIn - printStats.totalOut).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Signature */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '48px' }}>
                    <div style={{ textAlign: 'center', width: '180px' }}>
                        <div style={{ fontSize: '8.5px', color: '#64748b', marginBottom: '4px' }}>
                            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '8.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '52px', color: '#475569' }}>
                            Bendahara / Admin Kas,
                        </div>
                        <div style={{ borderBottom: '1px solid #0f172a', marginBottom: '4px' }}></div>
                        <div style={{ fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a' }}>{settings.adminName}</div>
                        <div style={{ fontSize: '8px', color: '#64748b', marginTop: '1px' }}>Kantor Notaris &amp; PPAT Havis Akbar</div>
                    </div>
                </div>
            </div>

            {/* --- ATTACHMENT MODAL --- */}
            <AttachmentModal
                isOpen={attachmentModalState.isOpen}
                onClose={() => setAttachmentModalState(prev => ({ ...prev, isOpen: false }))}
                currentUrl={attachmentModalState.currentUrl}
                onUpload={handleUploadAttachment}
                onRemove={handleRemoveAttachment}
                title={attachmentModalState.title}
                uploading={isUploading}
            />
        </div >
    );
};

export default App;