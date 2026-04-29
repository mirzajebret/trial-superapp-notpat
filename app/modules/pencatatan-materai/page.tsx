'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import {
  Stamp,
  PackagePlus,
  PackageMinus,
  BarChart3,
  History,
  Search,
  Filter,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  ChevronDown,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Package,
  Layers,
  CalendarDays,
  FileText,
  ShoppingCart,
  StickyNote,
} from 'lucide-react';
import {
  getMateraiRecords,
  addMaterai,
  updateMaterai,
  deleteMaterai,
  type MateraiRecord,
} from './actions';

// ────────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────────

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const today = () => new Date().toISOString().split('T')[0];

// ────────────────────────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'tambah-masuk' | 'tambah-keluar' | 'riwayat';
type FilterJenis = 'Semua' | 'Masuk' | 'Keluar';

interface FormState {
  tanggal: string;
  nominal: number;
  jumlah: number;
  sumberPembelian: string;
  digunakanUntuk: string;
  keterangan: string;
}

const defaultForm: FormState = {
  tanggal: today(),
  nominal: 10000,
  jumlah: 1,
  sumberPembelian: '',
  digunakanUntuk: '',
  keterangan: '',
};

// ────────────────────────────────────────────────────────────────────────────────
// TOAST
// ────────────────────────────────────────────────────────────────────────────────

interface ToastState { msg: string; ok: boolean; visible: boolean }

function useToast() {
  const [toast, setToast] = useState<ToastState>({ msg: '', ok: true, visible: false });
  const show = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  }, []);
  return { toast, show };
}

// ────────────────────────────────────────────────────────────────────────────────
// STAT CARD
// ────────────────────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, gradient, accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  gradient: string;
  accent: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${gradient}`}>
      <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />
      <div className="relative z-10 flex flex-col gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent} shadow-lg`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-white/70 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight mt-0.5">{value}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// FORM INPUT MASUK
// ────────────────────────────────────────────────────────────────────────────────

function FormMasuk({
  onSuccess, editData, onCancelEdit,
}: {
  onSuccess: (r: MateraiRecord) => void;
  editData?: MateraiRecord | null;
  onCancelEdit?: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [isPending, startTransition] = useTransition();
  const { toast, show } = useToast();

  useEffect(() => {
    if (editData && editData.type === 'Masuk') {
      setForm({
        tanggal: editData.tanggal,
        nominal: editData.nominal,
        jumlah: editData.jumlah,
        sumberPembelian: editData.sumberPembelian || '',
        digunakanUntuk: '',
        keterangan: editData.keterangan || '',
      });
    } else if (!editData) {
      setForm({ ...defaultForm });
    }
  }, [editData]);

  const set = (k: keyof FormState, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.jumlah <= 0) return show('Jumlah harus lebih dari 0', false);
    if (form.nominal <= 0) return show('Nominal harus lebih dari 0', false);

    startTransition(async () => {
      const payload = {
        type: 'Masuk' as const,
        tanggal: form.tanggal,
        nominal: Number(form.nominal),
        jumlah: Number(form.jumlah),
        sumberPembelian: form.sumberPembelian,
        keterangan: form.keterangan,
      };

      if (editData) {
        const res = await updateMaterai(editData.id, payload);
        if (res.success) {
          show('Data berhasil diperbarui!');
          onSuccess({ ...editData, ...payload });
          onCancelEdit?.();
        } else {
          show(res.error || 'Gagal memperbarui data', false);
        }
      } else {
        const res = await addMaterai(payload);
        if (res.success && res.data) {
          show('Materai masuk berhasil disimpan!');
          setForm({ ...defaultForm });
          onSuccess(res.data);
        } else {
          show(res.error || 'Gagal menyimpan data', false);
        }
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto">
      {toast.visible && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
        >
          {toast.ok ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <PackagePlus size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">
              {editData ? 'Edit Materai Masuk' : 'Tambah Materai Masuk'}
            </h2>
            <p className="text-emerald-100 text-xs">Catat pembelian / penambahan stok materai</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Tanggal Pembelian */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" /> Tanggal Pembelian <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.tanggal}
              onChange={(e) => set('tanggal', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
          </div>

          {/* Nominal & Jumlah */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stamp size={14} className="text-slate-400" /> Nominal Materai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.nominal}
                  onChange={(e) => set('nominal', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[10000, 6000, 3000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('nominal', v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${form.nominal === v ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300'}`}
                  >
                    {formatRp(v)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Package size={14} className="text-slate-400" /> Jumlah Materai <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.jumlah}
                onChange={(e) => set('jumlah', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Subtotal: <span className="font-semibold text-slate-600">{formatRp(form.nominal * form.jumlah)}</span>
              </p>
            </div>
          </div>

          {/* Sumber Pembelian */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShoppingCart size={14} className="text-slate-400" /> Sumber Pembelian <span className="text-slate-400 font-normal text-xs">(opsional)</span>
            </label>
            <input
              type="text"
              value={form.sumberPembelian}
              onChange={(e) => set('sumberPembelian', e.target.value)}
              placeholder="contoh: Kantor Pos, Toko ATK..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <StickyNote size={14} className="text-slate-400" /> Keterangan <span className="text-slate-400 font-normal text-xs">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => set('keterangan', e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {editData && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30"
            >
              {isPending ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Simpan Materai Masuk'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// FORM INPUT KELUAR
// ────────────────────────────────────────────────────────────────────────────────

function FormKeluar({
  onSuccess, editData, onCancelEdit, sisaStok,
}: {
  onSuccess: (r: MateraiRecord) => void;
  editData?: MateraiRecord | null;
  onCancelEdit?: () => void;
  sisaStok: number;
}) {
  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [isPending, startTransition] = useTransition();
  const { toast, show } = useToast();

  useEffect(() => {
    if (editData && editData.type === 'Keluar') {
      setForm({
        tanggal: editData.tanggal,
        nominal: editData.nominal,
        jumlah: editData.jumlah,
        sumberPembelian: '',
        digunakanUntuk: editData.digunakanUntuk || '',
        keterangan: editData.keterangan || '',
      });
    } else if (!editData) {
      setForm({ ...defaultForm });
    }
  }, [editData]);

  const set = (k: keyof FormState, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.jumlah <= 0) return show('Jumlah harus lebih dari 0', false);
    const availableStok = editData ? sisaStok + editData.jumlah : sisaStok;
    if (!editData && form.jumlah > availableStok)
      return show(`Stok tidak cukup! Sisa stok: ${availableStok} lembar`, false);

    startTransition(async () => {
      const payload = {
        type: 'Keluar' as const,
        tanggal: form.tanggal,
        nominal: Number(form.nominal),
        jumlah: Number(form.jumlah),
        digunakanUntuk: form.digunakanUntuk,
        keterangan: form.keterangan,
      };

      if (editData) {
        const res = await updateMaterai(editData.id, payload);
        if (res.success) {
          show('Data berhasil diperbarui!');
          onSuccess({ ...editData, ...payload });
          onCancelEdit?.();
        } else {
          show(res.error || 'Gagal memperbarui data', false);
        }
      } else {
        const res = await addMaterai(payload);
        if (res.success && res.data) {
          show('Penggunaan materai berhasil dicatat!');
          setForm({ ...defaultForm });
          onSuccess(res.data);
        } else {
          show(res.error || 'Gagal menyimpan data', false);
        }
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto">
      {toast.visible && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}
        >
          {toast.ok ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Stok info */}
      <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${sisaStok < 5 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
        <Layers size={16} />
        <span>Sisa stok saat ini: <strong>{sisaStok} lembar</strong></span>
        {sisaStok < 5 && <span className="ml-auto text-xs font-bold uppercase bg-red-100 px-2 py-0.5 rounded-full">Hampir habis!</span>}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-5 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <PackageMinus size={22} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">
              {editData ? 'Edit Penggunaan Materai' : 'Catat Penggunaan Materai'}
            </h2>
            <p className="text-rose-100 text-xs">Catat pemakaian materai untuk dokumen</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Tanggal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-slate-400" /> Tanggal Penggunaan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.tanggal}
              onChange={(e) => set('tanggal', e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
            />
          </div>

          {/* Nominal & Jumlah */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Stamp size={14} className="text-slate-400" /> Nominal Materai <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.nominal}
                  onChange={(e) => set('nominal', Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
                />
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[10000, 6000, 3000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set('nominal', v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${form.nominal === v ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:border-rose-300'}`}
                  >
                    {formatRp(v)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Package size={14} className="text-slate-400" /> Jumlah Digunakan <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={editData ? undefined : sisaStok}
                required
                value={form.jumlah}
                onChange={(e) => set('jumlah', Number(e.target.value))}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
              />
              {!editData && (
                <p className="text-xs text-slate-400 mt-1.5">Maks: {sisaStok} lembar tersedia</p>
              )}
            </div>
          </div>

          {/* Digunakan Untuk */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-slate-400" /> Digunakan Untuk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.digunakanUntuk}
              onChange={(e) => set('digunakanUntuk', e.target.value)}
              placeholder="contoh: Akta Jual Beli No. 01/2025, Akta Waris..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <StickyNote size={14} className="text-slate-400" /> Keterangan <span className="text-slate-400 font-normal text-xs">(opsional)</span>
            </label>
            <textarea
              rows={2}
              value={form.keterangan}
              onChange={(e) => set('keterangan', e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {editData && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:from-rose-600 hover:to-rose-700 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-rose-500/30"
            >
              {isPending ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Catat Penggunaan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ────────────────────────────────────────────────────────────────────────────────

function Dashboard({ records, onTabChange }: { records: MateraiRecord[]; onTabChange: (t: Tab) => void }) {
  const totalMasuk = records.filter((r) => r.type === 'Masuk').reduce((s, r) => s + r.jumlah, 0);
  const totalKeluar = records.filter((r) => r.type === 'Keluar').reduce((s, r) => s + r.jumlah, 0);
  const sisaStok = totalMasuk - totalKeluar;

  const nilaiMasuk = records.filter((r) => r.type === 'Masuk').reduce((s, r) => s + r.jumlah * r.nominal, 0);
  const nilaiKeluar = records.filter((r) => r.type === 'Keluar').reduce((s, r) => s + r.jumlah * r.nominal, 0);
  const nilaiSisa = nilaiMasuk - nilaiKeluar;

  // Last 5 usage
  const recent = [...records]
    .filter((r) => r.type === 'Keluar')
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 5);

  const pctUsed = totalMasuk > 0 ? Math.round((totalKeluar / totalMasuk) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          label="Total Materai Masuk"
          value={`${totalMasuk} lembar`}
          sub={`Nilai: ${formatRp(nilaiMasuk)}`}
          icon={ArrowUpCircle}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
          accent="bg-emerald-400/30"
        />
        <StatCard
          label="Total Materai Terpakai"
          value={`${totalKeluar} lembar`}
          sub={`Nilai: ${formatRp(nilaiKeluar)}`}
          icon={ArrowDownCircle}
          gradient="bg-gradient-to-br from-rose-500 to-rose-700"
          accent="bg-rose-400/30"
        />
        <StatCard
          label="Sisa Stok Materai"
          value={`${sisaStok} lembar`}
          sub={`Nilai estimasi: ${formatRp(nilaiSisa)}`}
          icon={Layers}
          gradient={sisaStok < 5 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-blue-500 to-blue-700'}
          accent={sisaStok < 5 ? 'bg-amber-400/30' : 'bg-blue-400/30'}
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-bold text-slate-800">Tingkat Pemakaian</h3>
          </div>
          <span className="text-sm font-semibold text-slate-500">{pctUsed}% dari total masuk</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pctUsed}%`,
              background: pctUsed > 75 ? 'linear-gradient(to right,#f97316,#ef4444)' : 'linear-gradient(to right,#3b82f6,#6366f1)',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>0 lembar</span>
          <span>{totalMasuk} lembar</span>
        </div>
        {sisaStok < 5 && sisaStok >= 0 && (
          <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
            <AlertCircle size={15} />
            <span>Stok materai hampir habis! Segera tambah stok.</span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onTabChange('tambah-masuk')}
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="bg-emerald-100 group-hover:bg-emerald-200 transition-colors p-3 rounded-xl">
            <PackagePlus size={22} className="text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 text-sm">Tambah Masuk</p>
            <p className="text-xs text-slate-500 mt-0.5">Catat pembelian baru</p>
          </div>
        </button>
        <button
          onClick={() => onTabChange('tambah-keluar')}
          className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="bg-rose-100 group-hover:bg-rose-200 transition-colors p-3 rounded-xl">
            <PackageMinus size={22} className="text-rose-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 text-sm">Catat Pemakaian</p>
            <p className="text-xs text-slate-500 mt-0.5">Kurangi stok materai</p>
          </div>
        </button>
      </div>

      {/* Recent usage */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History size={18} className="text-slate-500" />
          <h3 className="font-bold text-slate-800">Pemakaian Terbaru</h3>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">Belum ada riwayat pemakaian</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recent.map((r) => (
              <div key={r.id} className="px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="bg-rose-100 p-2 rounded-lg shrink-0">
                    <FileText size={14} className="text-rose-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{r.digunakanUntuk || '-'}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.tanggal)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-rose-600">{r.jumlah} lembar</span>
                  <p className="text-xs text-slate-400">{formatRp(r.nominal)}/lbr</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// RIWAYAT / TABLE
// ────────────────────────────────────────────────────────────────────────────────

function Riwayat({
  records,
  onEdit,
  onDelete,
}: {
  records: MateraiRecord[];
  onEdit: (r: MateraiRecord) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState<FilterJenis>('Semua');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast, show } = useToast();

  const filtered = records.filter((r) => {
    if (filterJenis !== 'Semua' && r.type !== filterJenis) return false;
    if (filterDateFrom && r.tanggal < filterDateFrom) return false;
    if (filterDateTo && r.tanggal > filterDateTo) return false;
    const q = search.toLowerCase();
    if (q) {
      return (
        r.keterangan?.toLowerCase().includes(q) ||
        r.sumberPembelian?.toLowerCase().includes(q) ||
        r.digunakanUntuk?.toLowerCase().includes(q) ||
        r.tanggal.includes(q)
      );
    }
    return true;
  });

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteMaterai(id);
      if (res.success) {
        show('Data berhasil dihapus!');
        onDelete(id);
      } else {
        show(res.error || 'Gagal menghapus data', false);
      }
      setDeleteConfirm(null);
    });
  };

  return (
    <div className="space-y-4">
      {toast.visible && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${toast.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {toast.ok ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokumen, sumber, keterangan..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition ${showFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
        >
          <Filter size={15} />
          Filter
          <ChevronDown size={14} className={`transition-transform ${showFilter ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1.5">Jenis Transaksi</label>
            <div className="flex gap-2 flex-wrap">
              {(['Semua', 'Masuk', 'Keluar'] as FilterJenis[]).map((j) => (
                <button
                  key={j}
                  onClick={() => setFilterJenis(j)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${filterJenis === j ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'}`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1.5">Dari Tanggal</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-700 mb-1.5">Sampai Tanggal</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Riwayat Materai</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {filtered.length} data
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Stamp size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Tidak ada data ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Nominal</th>
                  <th className="px-4 py-3">Jumlah</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatDate(r.tanggal)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${r.type === 'Masuk'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'}`}
                      >
                        {r.type === 'Masuk' ? <ArrowUpCircle size={11} /> : <ArrowDownCircle size={11} />}
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{formatRp(r.nominal)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${r.type === 'Masuk' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {r.type === 'Masuk' ? '+' : '-'}{r.jumlah} lbr
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-[260px]">
                      <p className="truncate">
                        {r.type === 'Masuk'
                          ? r.sumberPembelian
                            ? `Dari: ${r.sumberPembelian}`
                            : r.keterangan || '-'
                          : r.digunakanUntuk || r.keterangan || '-'}
                      </p>
                      {r.keterangan && (r.type === 'Masuk' ? r.sumberPembelian : r.digunakanUntuk) && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{r.keterangan}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {deleteConfirm === r.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(r.id)}
                              disabled={isPending}
                              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition disabled:opacity-60"
                            >
                              {isPending ? '...' : 'Hapus'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => onEdit(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(r.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────────────────────

export default function PencatatanMateraiPage() {
  const [records, setRecords] = useState<MateraiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [editRecord, setEditRecord] = useState<MateraiRecord | null>(null);

  useEffect(() => {
    getMateraiRecords().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  const sisaStok = records.filter((r) => r.type === 'Masuk').reduce((s, r) => s + r.jumlah, 0)
    - records.filter((r) => r.type === 'Keluar').reduce((s, r) => s + r.jumlah, 0);

  const handleAddSuccess = (newRec: MateraiRecord) => {
    setRecords((prev) => {
      const exists = prev.find((r) => r.id === newRec.id);
      if (exists) return prev.map((r) => (r.id === newRec.id ? newRec : r));
      return [newRec, ...prev].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    });
  };

  const handleUpdateSuccess = (updated: MateraiRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditRecord(null);
    setActiveTab('riwayat');
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handleEdit = (r: MateraiRecord) => {
    setEditRecord(r);
    setActiveTab(r.type === 'Masuk' ? 'tambah-masuk' : 'tambah-keluar');
  };

  const cancelEdit = () => {
    setEditRecord(null);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'text-blue-600' },
    { id: 'tambah-masuk', label: 'Tambah Masuk', icon: PackagePlus, color: 'text-emerald-600' },
    { id: 'tambah-keluar', label: 'Catat Pemakaian', icon: PackageMinus, color: 'text-rose-600' },
    { id: 'riwayat', label: 'Riwayat', icon: History, color: 'text-slate-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
              <Stamp size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Pencatatan Materai</h1>
              <p className="text-slate-500 text-sm">Kelola stok, pembelian, dan pemakaian materai kantor</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow p-1.5 mb-6 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'tambah-masuk' && tab.id !== 'tambah-keluar') setEditRecord(null); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center ${isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
              >
                <Icon size={16} className={isActive ? 'text-white' : tab.color} />
                {tab.label}
                {tab.id === 'riwayat' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {records.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Memuat data...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard records={records} onTabChange={setActiveTab} />
            )}
            {activeTab === 'tambah-masuk' && (
              <FormMasuk
                onSuccess={editRecord ? handleUpdateSuccess : handleAddSuccess}
                editData={editRecord?.type === 'Masuk' ? editRecord : null}
                onCancelEdit={cancelEdit}
              />
            )}
            {activeTab === 'tambah-keluar' && (
              <FormKeluar
                onSuccess={editRecord ? handleUpdateSuccess : handleAddSuccess}
                editData={editRecord?.type === 'Keluar' ? editRecord : null}
                onCancelEdit={cancelEdit}
                sisaStok={sisaStok}
              />
            )}
            {activeTab === 'riwayat' && (
              <Riwayat
                records={records}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
