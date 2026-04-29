"use client";

import React, { useState, useEffect } from "react";
import {
  Calculator, Copy, RefreshCw, Info, Save, Trash2,
  History, Printer, ChevronDown, FileText, CheckCircle2,
} from "lucide-react";
import rawPersyaratan from "@/data/persyaratan-ppat.json";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------


export interface JenisPeralihan {
  kode: string;
  label: string;
  npoptkp: number;
  deskripsi: string;
  syaratDokumen: string[];
}

const JENIS_PERALIHAN: JenisPeralihan[] = rawPersyaratan as JenisPeralihan[];



// PPh hanya untuk Jual Beli (kode 01)
const KODE_KENA_PPH = ["01"];

type NpopMode = "self" | "transaksi";

interface SavedCalculation {
  id: string;
  date: string;
  jenisPeralihan: string;
  npopMode: NpopMode;
  lsTanah: number;
  njopTanah: number;
  lsBangunan: number;
  njopBangunan: number;
  nilaiTransaksi: number;
  npoptkp: number;
  npop: number;
  nkp: number;
  bphtb: number;
  pph: number;
  pnbp: number;
  totalBiaya: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatRupiah = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(value);

const parseNumber = (value: string): number => {
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
};

const formatInput = (value: number): string =>
  value === 0 ? "" : new Intl.NumberFormat("id-ID").format(value);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function KalkulatorPajakPage() {
  // --- Inputs ---
  const [jenisKode, setJenisKode] = useState<string>("");
  const [npopMode, setNpopMode] = useState<NpopMode>("self");
  const [lsTanah, setLsTanah] = useState<number>(0);
  const [njopTanah, setNjopTanah] = useState<number>(0);
  const [lsBangunan, setLsBangunan] = useState<number>(0);
  const [njopBangunan, setNjopBangunan] = useState<number>(0);
  const [nilaiTransaksi, setNilaiTransaksi] = useState<number>(0);
  // PNBP now user-defined
  const [pnbpInput, setPnbpInput] = useState<number>(0);

  // --- Derived/Calc ---
  const [npoptkp, setNpoptkp] = useState<number>(0);
  const [njopSelfTanah, setNjopSelfTanah] = useState<number>(0);
  const [njopSelfBangunan, setNjopSelfBangunan] = useState<number>(0);
  const [njopSelfTotal, setNjopSelfTotal] = useState<number>(0);
  const [npop, setNpop] = useState<number>(0);
  const [nkp, setNkp] = useState<number>(0);
  const [bphtb, setBphtb] = useState<number>(0);
  const [pph, setPph] = useState<number>(0);
  const [totalBiaya, setTotalBiaya] = useState<number>(0);

  // --- History ---
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>([]);

  // UI state
  const [showSyarat, setShowSyarat] = useState<boolean>(true);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem("tax_calculator_history_v3");
    if (saved) {
      try { setSavedCalculations(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tax_calculator_history_v3", JSON.stringify(savedCalculations));
  }, [savedCalculations]);

  // --- Core calculation ---
  useEffect(() => {
    const jenis = JENIS_PERALIHAN.find((j) => j.kode === jenisKode);
    const curNpoptkp = jenis?.npoptkp ?? 0;
    setNpoptkp(curNpoptkp);

    const totalTanah = lsTanah * njopTanah;
    const totalBangunan = lsBangunan * njopBangunan;
    const totalSelf = totalTanah + totalBangunan;
    setNjopSelfTanah(totalTanah);
    setNjopSelfBangunan(totalBangunan);
    setNjopSelfTotal(totalSelf);

    const selectedNpop = npopMode === "self" ? totalSelf : nilaiTransaksi;
    setNpop(selectedNpop);

    const calcNkp = Math.max(selectedNpop - curNpoptkp, 0);
    setNkp(calcNkp);

    const calcBphtb = calcNkp * 0.05;
    setBphtb(calcBphtb);

    const calcPph = KODE_KENA_PPH.includes(jenisKode) ? selectedNpop * 0.025 : 0;
    setPph(calcPph);

    setTotalBiaya(calcBphtb + calcPph + pnbpInput);
  }, [jenisKode, npopMode, lsTanah, njopTanah, lsBangunan, njopBangunan, nilaiTransaksi, pnbpInput]);

  // --- Handlers ---
  const handleReset = () => {
    setJenisKode(""); setNpopMode("self");
    setLsTanah(0); setNjopTanah(0);
    setLsBangunan(0); setNjopBangunan(0);
    setNilaiTransaksi(0); setPnbpInput(0);
  };

  const jenisObj = JENIS_PERALIHAN.find((j) => j.kode === jenisKode);
  const jenisLabel = jenisObj?.label ?? "-";

  const handleCopy = () => {
    const syaratTeks = jenisObj
      ? jenisObj.syaratDokumen.map((s, i) => `  ${i + 1}. ${s}`).join("\n")
      : "  -";

    const text = `
*Estimasi Biaya – ${jenisLabel}*
Kab. Garut | ${new Date().toLocaleDateString("id-ID")}

*Perhitungan BPHTB:*
  Mode NPOP : ${npopMode === "self" ? "NJOP Self (Luas × NJOP/m²)" : "Harga Transaksi"}
  NPOP      : ${formatRupiah(npop)}
  NPOPTKP   : ${formatRupiah(npoptkp)}
  NKP       : ${formatRupiah(nkp)}

*Rincian Biaya:*
  1. BPHTB (Pembeli)   5% × NKP   : ${formatRupiah(bphtb)}
  2. PPh Final (Penjual) 2,5% NPOP: ${KODE_KENA_PPH.includes(jenisKode) ? formatRupiah(pph) : "Rp 0 (SKB)"}
  3. PNBP Balik Nama               : ${pnbpInput > 0 ? formatRupiah(pnbpInput) : "– (belum diisi)"}

*TOTAL ESTIMASI: ${formatRupiah(totalBiaya)}*

*Syarat Dokumen (${jenisLabel}):*
${syaratTeks}
    `.trim();
    navigator.clipboard.writeText(text);
    alert("Hasil perhitungan & syarat dokumen berhasil disalin!");
  };

  const handleSave = () => {
    if (!jenisKode) { alert("Pilih Jenis Peralihan terlebih dahulu."); return; }
    const newCalc: SavedCalculation = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }),
      jenisPeralihan: jenisLabel, npopMode,
      lsTanah, njopTanah, lsBangunan, njopBangunan, nilaiTransaksi,
      npoptkp, npop, nkp, bphtb, pph, pnbp: pnbpInput, totalBiaya,
    };
    setSavedCalculations((prev) => [newCalc, ...prev]);
    alert("Perhitungan berhasil disimpan!");
  };

  const handleLoad = (calc: SavedCalculation) => {
    const jenis = JENIS_PERALIHAN.find((j) => j.label === calc.jenisPeralihan);
    setJenisKode(jenis?.kode ?? "");
    setNpopMode(calc.npopMode);
    setLsTanah(calc.lsTanah ?? 0);
    setNjopTanah(calc.njopTanah ?? 0);
    setLsBangunan(calc.lsBangunan ?? 0);
    setNjopBangunan(calc.njopBangunan ?? 0);
    setNilaiTransaksi(calc.nilaiTransaksi ?? 0);
    setPnbpInput(calc.pnbp ?? 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Hapus riwayat ini?"))
      setSavedCalculations((prev) => prev.filter((item) => item.id !== id));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-12 font-sans text-gray-800 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto">

        {/* ── Screen Header ── */}
        <div className="mb-8 flex items-center gap-3 print:hidden">
          <div className="p-3 bg-slate-900 text-white rounded-lg shadow-md">
            <Calculator size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kalkulator BPHTB</h1>
            <p className="text-gray-500 text-sm">Estimasi pajak &amp; biaya transaksi properti – Kab. Garut</p>
          </div>
        </div>

        {/* ── Print Header ── */}
        <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-900 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Estimasi Biaya Transaksi Properti</h1>
          <p className="text-slate-600 mt-1">Kab. Garut &nbsp;|&nbsp; {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
          {jenisKode && <p className="mt-1 text-sm font-semibold text-slate-700">Jenis Peralihan: {jenisLabel}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ══════════════════════════════════════════
              LEFT COLUMN – Inputs
          ══════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Parameter Transaksi card ── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:shadow-none print:border-gray-300">

              {/* Card Header (screen only) */}
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-lg font-semibold text-slate-800">Parameter Transaksi</h2>
                <button onClick={handleReset} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                  <RefreshCw size={14} /> Reset Form
                </button>
              </div>

              {/* Print – Objek Pajak summary */}
              <div className="hidden print:block mb-6">
                <h2 className="text-base font-bold text-slate-800 border-b border-gray-300 pb-2 mb-3">Informasi Objek Pajak</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-gray-500">Jenis Peralihan</span><p className="font-semibold">{jenisLabel}</p></div>
                  <div><span className="text-gray-500">Dasar NPOP</span><p className="font-semibold">{npopMode === "self" ? "NJOP Self" : "Harga Transaksi"}</p></div>
                  {npopMode === "self" && (<>
                    <div><span className="text-gray-500">Luas Tanah</span><p className="font-semibold">{lsTanah} m² × {formatRupiah(njopTanah)}/m²</p></div>
                    <div><span className="text-gray-500">NJOP Tanah</span><p className="font-semibold">{formatRupiah(njopSelfTanah)}</p></div>
                    {lsBangunan > 0 && <>
                      <div><span className="text-gray-500">Luas Bangunan</span><p className="font-semibold">{lsBangunan} m² × {formatRupiah(njopBangunan)}/m²</p></div>
                      <div><span className="text-gray-500">NJOP Bangunan</span><p className="font-semibold">{formatRupiah(njopSelfBangunan)}</p></div>
                    </>}
                    <div><span className="text-gray-500">Total NJOP Self</span><p className="font-semibold">{formatRupiah(njopSelfTotal)}</p></div>
                  </>)}
                  {npopMode === "transaksi" && (
                    <div><span className="text-gray-500">Harga Transaksi</span><p className="font-semibold">{formatRupiah(nilaiTransaksi)}</p></div>
                  )}
                  <div><span className="text-gray-500">NPOP</span><p className="font-semibold">{formatRupiah(npop)}</p></div>
                  <div><span className="text-gray-500">NPOPTKP</span><p className="font-semibold">{formatRupiah(npoptkp)}</p></div>
                  <div><span className="text-gray-500">NKP</span><p className="font-bold text-slate-900">{formatRupiah(nkp)}</p></div>
                </div>
              </div>

              {/* ── Screen Inputs ── */}
              <div className="space-y-6 print:hidden">

                {/* 1. Jenis Peralihan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Peralihan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={jenisKode}
                      onChange={(e) => setJenisKode(e.target.value)}
                      className="w-full appearance-none pl-4 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-sm font-medium text-slate-900 bg-white"
                    >
                      <option value="">— Pilih Jenis Peralihan —</option>
                      {JENIS_PERALIHAN.map((j) => (
                        <option key={j.kode} value={j.kode}>{j.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {jenisKode && (
                    <p className="mt-2 text-xs text-gray-500 flex items-start gap-1.5">
                      <Info size={13} className="mt-0.5 flex-shrink-0" />
                      NPOPTKP otomatis: <strong>{formatRupiah(npoptkp)}</strong>&nbsp;|&nbsp;
                      {KODE_KENA_PPH.includes(jenisKode)
                        ? "Termasuk objek PPh Final 2,5% (atas penjual)."
                        : "Tidak termasuk objek PPh Final (0% / proses SKB)."}
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100" />

                {/* 2. Mode NPOP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dasar Pengenaan Pajak (NPOP) Berdasarkan
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(["self", "transaksi"] as NpopMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setNpopMode(mode)}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${npopMode === mode
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 ${npopMode === mode ? "border-white bg-white" : "border-gray-400"}`}>
                          {npopMode === mode && <div className="w-2 h-2 rounded-full bg-slate-900 m-px" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-snug">
                            {mode === "self" ? "Total NJOP Self" : "Harga Transaksi / Nilai Pasar"}
                          </p>
                          <p className={`text-xs mt-0.5 ${npopMode === mode ? "text-slate-300" : "text-gray-400"}`}>
                            {mode === "self" ? "Hitung dari Luas × NJOP/m² tanah & bangunan" : "Masukkan harga jual / nilai pasar"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3A. NJOP Self Inputs */}
                {npopMode === "self" && (
                  <div className="space-y-4">
                    {/* Tanah */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanah</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Luas Tanah</label>
                          <div className="relative">
                            <input
                              type="text" inputMode="decimal"
                              value={lsTanah ? String(lsTanah) : ""}
                              onChange={(e) => setLsTanah(parseNumber(e.target.value))}
                              placeholder="0"
                              className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-gray-300"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">m²</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">NJOP / m²</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">Rp</span>
                            <input
                              type="text" inputMode="numeric"
                              value={njopTanah ? formatInput(njopTanah) : ""}
                              onChange={(e) => setNjopTanah(parseNumber(e.target.value))}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                      {njopSelfTanah > 0 && (
                        <p className="text-xs text-slate-600">= <strong>{formatRupiah(njopSelfTanah)}</strong></p>
                      )}
                    </div>

                    {/* Bangunan */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bangunan <span className="normal-case font-normal text-gray-400">(opsional)</span></p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Luas Bangunan</label>
                          <div className="relative">
                            <input
                              type="text" inputMode="decimal"
                              value={lsBangunan ? String(lsBangunan) : ""}
                              onChange={(e) => setLsBangunan(parseNumber(e.target.value))}
                              placeholder="0"
                              className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-gray-300"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">m²</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">NJOP / m²</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">Rp</span>
                            <input
                              type="text" inputMode="numeric"
                              value={njopBangunan ? formatInput(njopBangunan) : ""}
                              onChange={(e) => setNjopBangunan(parseNumber(e.target.value))}
                              placeholder="0"
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-sm font-medium text-slate-900 placeholder:text-gray-300"
                            />
                          </div>
                        </div>
                      </div>
                      {njopSelfBangunan > 0 && (
                        <p className="text-xs text-slate-600">= <strong>{formatRupiah(njopSelfBangunan)}</strong></p>
                      )}
                    </div>

                    {njopSelfTotal > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-600">Total NJOP Self (Tanah + Bangunan)</span>
                        <span className="font-bold text-slate-900">{formatRupiah(njopSelfTotal)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3B. Nilai Transaksi */}
                {npopMode === "transaksi" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga Transaksi / Nilai Pasar</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                      <input
                        type="text" inputMode="numeric"
                        value={nilaiTransaksi ? formatInput(nilaiTransaksi) : ""}
                        onChange={(e) => setNilaiTransaksi(parseNumber(e.target.value))}
                        placeholder="0"
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-lg font-medium text-slate-900 placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                )}

                {/* NPOP → NKP summary */}
                {npop > 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700 font-medium">NPOP</span>
                      <span className="font-bold text-blue-900">{formatRupiah(npop)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-blue-600 text-xs">NPOPTKP ({jenisLabel})</span>
                      <span className="text-blue-800 text-xs font-semibold">− {formatRupiah(npoptkp)}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-200">
                      <span className="text-blue-700 font-semibold text-xs">NKP (Nilai Kena Pajak)</span>
                      <span className="font-bold text-blue-900 text-sm">{formatRupiah(nkp)}</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-100" />

                {/* 4. PNBP – user input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PNBP Balik Nama
                    <span className="ml-2 text-xs font-normal text-gray-400">(isikan nominal sesuai konfirmasi)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                    <input
                      type="text" inputMode="numeric"
                      value={pnbpInput ? formatInput(pnbpInput) : ""}
                      onChange={(e) => setPnbpInput(parseNumber(e.target.value))}
                      placeholder="0 (kosongkan jika belum diketahui)"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all outline-none text-base font-medium text-slate-900 placeholder:text-gray-300"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400 flex items-start gap-1">
                    <Info size={12} className="flex-shrink-0 mt-0.5" />
                    Biaya PNBP disesuaikan oleh kantor BPN/PPAT. Estimasi umum: 1‰ dari NPOP (min Rp 50.000).
                  </p>
                </div>

              </div>
            </div>

            {/* ── Syarat Dokumen card ── */}
            {jenisObj && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-gray-300">
                {/* Toggle header (screen) */}
                <button
                  type="button"
                  onClick={() => setShowSyarat((v) => !v)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors print:hidden"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-700" />
                    <span className="font-semibold text-slate-800">Syarat Dokumen Klien</span>
                    <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {jenisLabel}
                    </span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${showSyarat ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Print header */}
                <div className="hidden print:flex items-center gap-2 px-6 py-4 border-b border-gray-200">
                  <FileText size={16} className="text-slate-700" />
                  <span className="font-bold text-slate-800">Syarat Dokumen – {jenisLabel}</span>
                </div>

                {/* Deskripsi + list */}
                {(showSyarat || true) && (
                  <div className={`px-6 pb-6 ${showSyarat ? "block" : "hidden"} print:block`}>
                    {jenisObj.deskripsi && (
                      <p className="text-xs text-gray-500 mb-4 pt-1 italic">{jenisObj.deskripsi}</p>
                    )}
                    <ul className="space-y-2">
                      {jenisObj.syaratDokumen.map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                          <CheckCircle2
                            size={15}
                            className="flex-shrink-0 mt-0.5 text-emerald-500 print:text-gray-600"
                          />
                          <span>{doc}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex gap-1.5 print:bg-transparent print:p-0 print:text-gray-500">
                      <Info size={12} className="flex-shrink-0 mt-0.5" />
                      Dokumen di atas bersifat umum. Persyaratan final ditentukan oleh PPAT dan instansi terkait.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Riwayat ── */}
            {savedCalculations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 print:hidden">
                <div className="flex items-center gap-2 mb-4">
                  <History size={20} className="text-slate-900" />
                  <h2 className="text-lg font-semibold text-slate-800">Riwayat Tersimpan</h2>
                </div>
                <div className="space-y-3">
                  {savedCalculations.map((calc) => (
                    <div
                      key={calc.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => handleLoad(calc)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                            {calc.jenisPeralihan}
                          </span>
                          <span className="text-xs text-gray-400">{calc.date}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-900">
                          BPHTB: {formatRupiah(calc.bphtb)}&nbsp;|&nbsp;Total: {formatRupiah(calc.totalBiaya)}
                        </div>
                        <div className="text-xs text-gray-500">
                          NPOP: {formatRupiah(calc.npop)} | NKP: {formatRupiah(calc.nkp)}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(calc.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════
              RIGHT COLUMN – Summary sticky
          ══════════════════════════════════════════ */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border print:border-gray-300">

                {/* Total header */}
                <div className="bg-slate-900 p-6 text-white print:bg-gray-100 print:text-slate-900 print:border-b print:border-gray-300">
                  <h3 className="text-xs font-medium opacity-75 mb-1 uppercase tracking-widest">Total Estimasi</h3>
                  <div className="text-3xl font-bold tracking-tight">{formatRupiah(totalBiaya)}</div>
                  {jenisKode && (
                    <p className="text-xs opacity-60 mt-1 line-clamp-1">{jenisLabel}</p>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Rincian biaya */}
                  <div className="space-y-3">

                    {/* BPHTB */}
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <div>
                        <span className="text-sm text-gray-700 font-medium">BPHTB</span>
                        <p className="text-xs text-gray-400">5% × NKP (Pembeli)</p>
                      </div>
                      <span className={`font-bold text-sm ${bphtb === 0 ? "text-gray-300" : "text-slate-800"}`}>
                        {formatRupiah(bphtb)}
                      </span>
                    </div>

                    {/* PPh */}
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <div>
                        <span className="text-sm text-gray-700 font-medium">PPh Final</span>
                        <p className="text-xs text-gray-400">2,5% × NPOP (Penjual)</p>
                      </div>
                      {KODE_KENA_PPH.includes(jenisKode) ? (
                        <span className={`font-bold text-sm ${pph === 0 ? "text-gray-300" : "text-slate-800"}`}>
                          {formatRupiah(pph)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {jenisKode ? "Tidak Kena (SKB)" : "–"}
                        </span>
                      )}
                    </div>

                    {/* PNBP – user input */}
                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                      <div>
                        <span className="text-sm text-gray-700 font-medium">PNBP BN</span>
                        <p className="text-xs text-gray-400">Input manual</p>
                      </div>
                      <span className={`font-bold text-sm ${pnbpInput === 0 ? "text-gray-300" : "text-slate-800"}`}>
                        {pnbpInput > 0 ? formatRupiah(pnbpInput) : "Belum diisi"}
                      </span>
                    </div>
                  </div>

                  {/* Formula box */}
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>NPOP</span>
                      <span className="font-medium text-gray-700">{formatRupiah(npop)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NPOPTKP</span>
                      <span className="font-medium text-gray-700">− {formatRupiah(npoptkp)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                      <span className="font-semibold text-gray-600">NKP</span>
                      <span className="font-bold text-gray-800">{formatRupiah(nkp)}</span>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                    <Info size={13} className="flex-shrink-0 mt-0.5" />
                    <span>Estimasi awal. Angka final ditentukan oleh PPAT, BPN, dan kantor BAPENDA Kab. Garut.</span>
                  </div>

                  {/* Action Buttons – screen only */}
                  <div className="print:hidden space-y-2 pt-1">
                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-4 rounded-lg transition-all active:scale-95 shadow-md hover:shadow-lg text-sm"
                    >
                      <Printer size={16} /> Export / Print
                    </button>
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 text-sm"
                    >
                      <Copy size={16} /> Salin Hasil
                    </button>
                    <button
                      onClick={handleSave}
                      className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 font-semibold py-2.5 px-4 rounded-lg transition-all active:scale-95 shadow-md hover:shadow-lg text-sm"
                    >
                      <Save size={16} /> Simpan
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Print: Rincian biaya tabel ── */}
              <div className="hidden print:block bg-white border border-gray-300 rounded-xl overflow-hidden mt-4">
                <div className="px-4 py-3 bg-gray-100 border-b border-gray-300">
                  <p className="font-bold text-sm text-slate-800">Rincian Estimasi Biaya</p>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-600">BPHTB (Pembeli) – 5% × NKP</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(bphtb)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-600">
                        PPh Final (Penjual) – {KODE_KENA_PPH.includes(jenisKode) ? "2,5% × NPOP" : "Tidak Kena"}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {KODE_KENA_PPH.includes(jenisKode) ? formatRupiah(pph) : "Rp 0 (SKB)"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="px-4 py-2.5 text-gray-600">PNBP Balik Nama</td>
                      <td className="px-4 py-2.5 text-right font-semibold">
                        {pnbpInput > 0 ? formatRupiah(pnbpInput) : "– (belum diisi)"}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white">
                      <td className="px-4 py-3 font-bold">TOTAL ESTIMASI</td>
                      <td className="px-4 py-3 text-right font-bold text-lg">{formatRupiah(totalBiaya)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── Print Footer ── */}
        <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-center text-gray-400">
          Dokumen ini merupakan estimasi awal biaya transaksi properti. Dihasilkan oleh Sistem Informasi PPAT – Kab. Garut.
        </div>

      </div>
    </div>
  );
}
