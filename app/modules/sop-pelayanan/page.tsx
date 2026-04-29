"use client";
import React, { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Play, Trash2, X, Edit2, ChevronUp, ChevronDown,
  CheckSquare, GitBranch, BarChart2, Info, Copy, Printer,
  CheckCircle2, Circle, ChevronRight, ChevronLeft, CheckCheck,
  Search, LayoutList, Save, GripVertical,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
type StepType = "checklist" | "choice" | "input" | "summary";
type Kategori = "PPAT" | "Notaris" | "Umum";
type NodeColor = "blue" | "amber" | "green" | "red" | "violet" | "slate";
interface ChecklistItem { id: string; label: string; required: boolean; }
interface Choice { label: string; value: string; description?: string; color?: NodeColor; stateKey: string; }
interface InputField {
  key: string; label: string; type: "text" | "number" | "currency";
  placeholder?: string; required?: boolean; hint?: string;
  conditional?: { key: string; value: string };
}
interface SOPStep {
  id: string; title: string; script: string; scriptNote?: string; type: StepType;
  checklistItems?: ChecklistItem[]; choices?: Choice[]; inputs?: InputField[];
}
interface SOP {
  id: string; judul: string; deskripsi: string; kategori: Kategori;
  steps: SOPStep[]; isBuiltIn?: boolean; createdAt: string; updatedAt: string;
}

// ============================================================
// AJB BUILT-IN SOP
// ============================================================
const AJB_SOP: SOP = {
  id: "ajb-v1", judul: "Akta Jual Beli (AJB) & Balik Nama",
  deskripsi: "Panduan pelayanan front office untuk klien yang ingin mengurus AJB dan Balik Nama sertifikat properti di Kab. Garut.",
  kategori: "PPAT", isBuiltIn: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: new Date().toISOString(),
  steps: [
    {
      id: "s1", title: "Penyambutan & Pemeriksaan Berkas", type: "checklist",
      script: "Selamat pagi, Bapak/Ibu. Silakan duduk. Ada yang bisa kami bantu?\n\nOh, mau mengurus Akta Jual Beli (AJB) ya. Baik, untuk langkah pertama, boleh saya pinjam Sertifikat Asli (SHM) dan PBB tahun terakhirnya untuk saya cek terlebih dahulu?",
      checklistItems: [
        { id: "shm", label: "Sertifikat Asli (SHM / HGB)", required: true },
        { id: "pbb", label: "PBB Tahun Terakhir", required: true },
        { id: "ktp-p", label: "KTP Pihak Penjual (jika tersedia)", required: false },
        { id: "ktp-b", label: "KTP Calon Pembeli (jika tersedia)", required: false },
      ],
    },
    {
      id: "s2", title: "Jenis Sertifikat?", type: "choice",
      script: "Bapak/Ibu, ini sertifikatnya apakah masih berbentuk Sertifikat Analog (buku hijau) atau sudah berupa Sertel (Sertifikat Elektronik)?\n\nSebab alur dan rincian biayanya sedikit berbeda.",
      scriptNote: "Tips: Buku hijau lama = Analog. Selembar kertas HVS dengan QR = Sertel.",
      choices: [
        { label: "Analog (Buku Hijau)", value: "analog", description: "Validasi Pajak → Plotting → Cek Sertifikat → Alih Media → AJB → BN", color: "amber", stateKey: "jenisSertifikat" },
        { label: "Sertel (Elektronik)", value: "sertel", description: "Cek Sertifikat → AJB → Balik Nama (lebih ringkas)", color: "blue", stateKey: "jenisSertifikat" },
      ],
    },
    {
      id: "s3", title: "Kondisi Pihak Penjual?", type: "choice",
      script: "Nama suami dan istri pihak penjual yang tertera di sertifikat, apakah keduanya masih ada (hidup) dan bisa hadir nanti?",
      scriptNote: "Jika tidak bisa hadir atau salah satu meninggal, diperlukan dokumen tambahan.",
      choices: [
        { label: "Ya, keduanya hadir", value: "hadir_semua", description: "Proses berjalan normal", color: "green", stateKey: "kondisiPenjual" },
        { label: "Hanya salah satu (janda/duda)", value: "salah_satu", description: "Perlu Akte Kematian pasangan", color: "amber", stateKey: "kondisiPenjual" },
        { label: "Kuasa / Ahli Waris", value: "kuasa", description: "Perlu Surat Kuasa Notaril / Surat Keterangan Ahli Waris", color: "red", stateKey: "kondisiPenjual" },
      ],
    },
    {
      id: "s4", title: "Data Pihak Pembeli", type: "input",
      script: "Selanjutnya untuk pihak pembeli. Nanti sertifikatnya mau dibalik nama atas nama siapa, Bapak/Ibu?",
      inputs: [
        { key: "namaPembeli", label: "Nama Lengkap Pembeli (sesuai KTP)", type: "text", placeholder: "Contoh: Budi Santoso", required: true },
        { key: "statusPernikahan", label: "Status Pernikahan Pembeli", type: "text", placeholder: "Menikah / Belum Menikah", hint: "Jika menikah, nama istri juga perlu dicantumkan" },
      ],
    },
    {
      id: "s5", title: "Status NPOPTKP Pembeli?", type: "choice",
      script: "Apakah calon pembeli dari tahun 2024 sudah pernah melakukan balik nama sertifikat di wilayah Garut?",
      scriptNote: "Ini berkaitan dengan BPHTB. Belum pernah = NPOPTKP Rp 80 jt. Sudah pernah = progresif (0 rupiah).",
      choices: [
        { label: "Belum pernah (sejak 2024)", value: "standard", description: "NPOPTKP berlaku → potongan Rp 80.000.000", color: "green", stateKey: "npoptkpMode" },
        { label: "Sudah pernah di Garut", value: "progresif", description: "NPOPTKP = Rp 0 (tarif progresif)", color: "red", stateKey: "npoptkpMode" },
      ],
    },
    {
      id: "s6", title: "Nilai Transaksi & Biaya Operasional", type: "input",
      script: "Untuk perhitungan nilai transaksinya sebagai dasar pajak, patokan awalnya adalah NJOP di PBB Tahun Terakhir dikali 100%.",
      scriptNote: "Lihat di lembar PBB bagian 'NJOP Bumi' dan 'NJOP Bangunan' — jumlahkan keduanya.",
      inputs: [
        { key: "nilaiNJOP", label: "NJOP / Nilai Transaksi (dari PBB)", type: "currency", placeholder: "0", required: true, hint: "Nilai NJOP tertera di lembar PBB" },
        { key: "biayaValidasiPajak", label: "Biaya Validasi Pajak", type: "currency", placeholder: "0", conditional: { key: "jenisSertifikat", value: "analog" } },
        { key: "biayaPlotting", label: "Biaya Plotting BPN", type: "currency", placeholder: "0", conditional: { key: "jenisSertifikat", value: "analog" } },
        { key: "biayaCekSertifikat", label: "Biaya Cek Sertifikat BPN", type: "currency", placeholder: "0" },
        { key: "honorariumAJB", label: "Honorarium AJB & Jasa PPAT", type: "currency", placeholder: "0" },
        { key: "biayaAlihMedia", label: "Biaya Alih Media (Analog→Sertel)", type: "currency", placeholder: "0", conditional: { key: "jenisSertifikat", value: "analog" } },
      ],
    },
    { id: "s7", title: "Estimasi Biaya & Rangkuman Akhir", type: "summary", script: "Berikut adalah estimasi total biaya untuk proses AJB dan Balik Nama berdasarkan data yang telah Bapak/Ibu sampaikan." },
  ],
};

// ============================================================
// HELPERS
// ============================================================
const formatRupiah = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v);
const parseNumber = (v: string) => parseFloat(v.replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.]/g, "")) || 0;
const formatInputNum = (v: number) => v === 0 ? "" : new Intl.NumberFormat("id-ID").format(v);
const uid = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const KATEGORI_COLORS: Record<Kategori, string> = {
  PPAT: "bg-blue-100 text-blue-700 border-blue-200",
  Notaris: "bg-purple-100 text-purple-700 border-purple-200",
  Umum: "bg-slate-100 text-slate-600 border-slate-200",
};

const CHOICE_PILL: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  slate: "bg-slate-50 text-slate-700 border-slate-200",
};

// ============================================================
// FLOWCHART LAYOUT ENGINE
// ============================================================
const CW = 860;             // canvas width
const CX = CW / 2;          // center x
const RECT_W = 264;
const RECT_L = CX - RECT_W / 2;
const RECT_BASE_H = 100;
// Diamond: rotate a square of side D. Visual half-diagonal = D*sqrt(2)/2
const D_SIDE = 108;
const D_HALF = Math.round(D_SIDE * 1.4142 / 2); // ≈76 px visual half-diagonal
const GAP = 56; // gap between node bottom and next node top
const START_Y = 20;
const START_H = 40;

interface LNode { step: SOPStep; i: number; top: number; nH: number; bH: number; tot: number; }

function nH(s: SOPStep) {
  if (s.type === "choice") return D_HALF * 2;
  const e = s.type === "checklist" ? (s.checklistItems?.length ?? 0) * 22
    : s.type === "input" ? (s.inputs?.length ?? 0) * 22 : 0;
  return RECT_BASE_H + e;
}
function bH(s: SOPStep) { return s.type === "choice" && (s.choices?.length ?? 0) > 0 ? 52 : 0; }

function computeLayout(steps: SOPStep[]) {
  let y = START_Y + START_H + GAP;
  const nodes: LNode[] = steps.map((step, i) => {
    const n = nH(step), b = bH(step);
    const node: LNode = { step, i, top: y, nH: n, bH: b, tot: y + n + b };
    y += n + b + GAP;
    return node;
  });
  const endY = y;
  return { nodes, endY, totalH: endY + START_H + 40 };
}

// ============================================================
// RECT NODE
// ============================================================
const RECT_STYLES: Record<string, { hdr: string; border: string; icon: string; tag: string; label: string }> = {
  checklist: { hdr: "bg-blue-600", border: "border-blue-400", icon: "text-white", tag: "bg-blue-100 text-blue-700", label: "Checklist" },
  input: { hdr: "bg-violet-600", border: "border-violet-400", icon: "text-white", tag: "bg-violet-100 text-violet-700", label: "Input Data" },
  summary: { hdr: "bg-slate-900", border: "border-slate-600", icon: "text-slate-300", tag: "bg-slate-700 text-slate-200", label: "Ringkasan" },
};
const RECT_ICONS: Record<string, React.FC<any>> = { checklist: CheckSquare, input: LayoutList, summary: BarChart2 };

function RectNode({ n, canEdit, isFirst, isLast, onEdit, onDel, onUp, onDn }: {
  n: LNode; canEdit: boolean; isFirst: boolean; isLast: boolean;
  onEdit(): void; onDel(): void; onUp(): void; onDn(): void;
}) {
  const s = n.step;
  const st = RECT_STYLES[s.type] ?? RECT_STYLES.checklist;
  const Icon = RECT_ICONS[s.type] ?? CheckSquare;
  return (
    <div className="absolute group" style={{ top: n.top, left: RECT_L, width: RECT_W }}>
      {/* node */}
      <div className={`border-2 ${st.border} bg-white rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow duration-200`}>
        <div className={`${st.hdr} px-4 py-2.5 flex items-center gap-2`}>
          <Icon size={13} className={st.icon} />
          <span className="text-white text-xs font-bold uppercase tracking-wider">{st.label}</span>
          <span className="ml-auto text-white/50 text-xs font-semibold">#{n.i + 1}</span>
        </div>
        <div className="px-4 pt-3 pb-4">
          <p className="text-sm font-bold text-slate-800 mb-2 leading-snug">{s.title}</p>
          {s.type === "checklist" && s.checklistItems?.map(it => (
            <div key={it.id} className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <div className={`w-3.5 h-3.5 rounded border-2 shrink-0 flex items-center justify-center ${it.required ? "border-blue-400 bg-blue-50" : "border-slate-300"}`}>
                {it.required && <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />}
              </div>
              <span className="truncate">{it.label}</span>
              {it.required && <span className="ml-auto text-blue-500 font-bold shrink-0">*</span>}
            </div>
          ))}
          {s.type === "input" && s.inputs?.map(f => (
            <div key={f.key} className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <span className="truncate">{f.label}</span>
              {f.required && <span className="text-red-500 ml-auto shrink-0 font-bold">*</span>}
              {f.conditional && <span className="text-slate-400 text-xs shrink-0">(kond.)</span>}
            </div>
          ))}
          {s.type === "summary" && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
              <BarChart2 size={12} /> Kalkulasi otomatis berdasarkan input sebelumnya
            </div>
          )}
          {s.scriptNote && (
            <div className="mt-2.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-amber-700">
              <Info size={11} className="shrink-0 mt-0.5" /><span className="line-clamp-1">{s.scriptNote}</span>
            </div>
          )}
        </div>
      </div>
      {/* hover toolbar */}
      {canEdit && (
        <div className="absolute -top-9 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto">
          <button onClick={onUp} disabled={isFirst} title="Naik" className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 hover:border-blue-300 transition-colors"><ChevronUp size={12} /></button>
          <button onClick={onDn} disabled={isLast} title="Turun" className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 hover:border-blue-300 transition-colors"><ChevronDown size={12} /></button>
          <button onClick={onEdit} title="Edit" className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"><Edit2 size={12} /></button>
          <button onClick={onDel} title="Hapus" className="p-1.5 bg-white border border-red-200 rounded-lg shadow-sm text-red-400 hover:text-red-600 hover:border-red-400 transition-colors"><Trash2 size={12} /></button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// DIAMOND NODE
// ============================================================
function DiamondNode({ n, canEdit, isFirst, isLast, onEdit, onDel, onUp, onDn }: {
  n: LNode; canEdit: boolean; isFirst: boolean; isLast: boolean;
  onEdit(): void; onDel(): void; onUp(): void; onDn(): void;
}) {
  const s = n.step;
  const diamLeft = CX - D_SIDE / 2;
  return (
    <div className="absolute group" style={{ top: n.top, left: 0, width: CW }}>
      {/* diamond */}
      <div className="absolute" style={{ left: diamLeft, top: 0, width: D_SIDE, height: D_SIDE }}>
        <div className="absolute inset-0 border-[2.5px] border-amber-400 bg-amber-50 rounded-lg shadow-md"
          style={{ transform: "rotate(45deg)", transformOrigin: "center" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-2">
          <GitBranch size={12} className="text-amber-500 mb-1 shrink-0" />
          <p className="text-xs font-bold text-amber-800 text-center leading-tight">{s.title}</p>
        </div>
        {canEdit && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none group-hover:pointer-events-auto whitespace-nowrap z-20">
            <button onClick={onUp} disabled={isFirst} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><ChevronUp size={12} /></button>
            <button onClick={onDn} disabled={isLast} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 disabled:opacity-30 transition-colors"><ChevronDown size={12} /></button>
            <button onClick={onEdit} className="p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 transition-colors"><Edit2 size={12} /></button>
            <button onClick={onDel} className="p-1.5 bg-white border border-red-200 rounded-lg shadow-sm text-red-400 hover:text-red-600 transition-colors"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
      {/* choice pills */}
      {s.choices && s.choices.length > 0 && (
        <div className="absolute flex flex-wrap justify-center gap-2 px-16"
          style={{ top: D_HALF * 2 + 10, left: 0, width: CW }}>
          {s.choices.map(c => (
            <span key={c.value} className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${CHOICE_PILL[c.color ?? "slate"]}`}>
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// SVG ARROW CONNECTOR
// ============================================================
function AddConnectorBtn({ y, label, onClick }: { y: number; label?: string; onClick(): void }) {
  return (
    <div className="absolute flex flex-col items-center" style={{ top: y - 13, left: 0, width: CW }}>
      <button onClick={onClick}
        className="w-6 h-6 bg-white border-2 border-slate-300 hover:border-blue-500 text-slate-300 hover:text-blue-500 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-125 shadow-sm"
        title={label ?? "Tambah langkah"}>+</button>
    </div>
  );
}

// ============================================================
// FLOWCHART CANVAS
// ============================================================
function FlowchartCanvas({ sop, canEdit, onEditStep, onDeleteStep, onMoveStep, onAddStep }: {
  sop: SOP; canEdit: boolean;
  onEditStep(s: SOPStep): void; onDeleteStep(id: string): void;
  onMoveStep(id: string, dir: "up" | "down"): void; onAddStep(after?: string): void;
}) {
  const { nodes, endY, totalH } = computeLayout(sop.steps);
  const MK = "sop-arrow";

  return (
    <div className="relative mx-auto" style={{ width: CW, minHeight: totalH }}>
      {/* Dot grid bg */}
      <svg className="absolute inset-0 pointer-events-none" width={CW} height={totalH} style={{ opacity: 0.4 }}>
        <defs>
          <pattern id="dot" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect width={CW} height={totalH} fill="url(#dot)" />
      </svg>

      {/* SVG Arrows */}
      <svg className="absolute inset-0 pointer-events-none overflow-visible" width={CW} height={totalH}>
        <defs>
          <marker id={MK} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
          </marker>
        </defs>
        {/* start → first */}
        {nodes.length > 0 && (
          <line x1={CX} y1={START_Y + START_H + 1} x2={CX} y2={nodes[0].top - 3}
            stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${MK})`} />
        )}
        {/* between nodes */}
        {nodes.map((nd, i) => {
          if (i >= nodes.length - 1) return null;
          return (
            <line key={`l${i}`} x1={CX} y1={nd.tot + 1} x2={CX} y2={nodes[i + 1].top - 3}
              stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${MK})`} />
          );
        })}
        {/* last → end */}
        {nodes.length > 0 && (
          <line x1={CX} y1={nodes[nodes.length - 1].tot + 1} x2={CX} y2={endY - 3}
            stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${MK})`} />
        )}
        {/* special horizontal bracket for diamond choices */}
        {nodes.map((nd) => {
          if (nd.step.type !== "choice" || (nd.step.choices?.length ?? 0) === 0) return null;
          const cy = nd.top + D_HALF; // center y of diamond in visual space
          const lx = CX - D_HALF - 2; // left tip of diamond
          const rx = CX + D_HALF + 2; // right tip
          return (
            <g key={`branch-${nd.step.id}`}>
              <line x1={lx} y1={cy} x2={CX - 90} y2={cy} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
              <line x1={rx} y1={cy} x2={CX + 90} y2={cy} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
            </g>
          );
        })}
      </svg>

      {/* START */}
      <div className="absolute flex justify-center" style={{ top: START_Y, left: 0, width: CW }}>
        <div className="px-6 py-2 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg ring-4 ring-emerald-500/20 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> MULAI
        </div>
      </div>

      {/* ADD FIRST */}
      {canEdit && nodes.length === 0 && (
        <div className="absolute flex justify-center" style={{ top: START_Y + START_H + GAP / 2 - 16, left: 0, width: CW }}>
          <button onClick={() => onAddStep()}
            className="flex items-center gap-2 px-5 py-2 bg-white border-2 border-dashed border-blue-400 text-blue-500 hover:bg-blue-50 rounded-full text-xs font-bold transition-colors shadow-sm">
            <Plus size={13} /> Tambah Langkah Pertama
          </button>
        </div>
      )}

      {/* NODES */}
      {nodes.map((nd, i) => {
        const isFirst = i === 0, isLast = i === nodes.length - 1;
        const props = {
          n: nd, canEdit, isFirst, isLast,
          onEdit() { onEditStep(nd.step); },
          onDel() { if (confirm("Hapus langkah ini?")) onDeleteStep(nd.step.id); },
          onUp() { onMoveStep(nd.step.id, "up"); },
          onDn() { onMoveStep(nd.step.id, "down"); },
        };
        return nd.step.type === "choice"
          ? <DiamondNode key={nd.step.id} {...props} />
          : <RectNode key={nd.step.id} {...props} />;
      })}

      {/* ADD CONNECTOR BUTTONS */}
      {canEdit && nodes.map((nd, i) => {
        const nxtTop = i < nodes.length - 1 ? nodes[i + 1].top : endY;
        const midY = (nd.tot + nxtTop) / 2;
        return <AddConnectorBtn key={`add-${i}`} y={midY} onClick={() => onAddStep(nd.step.id)} />;
      })}

      {/* END */}
      <div className="absolute flex justify-center" style={{ top: endY, left: 0, width: CW }}>
        <div className="px-6 py-2 bg-slate-800 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-2">
          ■ SELESAI
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEP EDITOR MODAL
// ============================================================
function StepEditorModal({ initial, onSave, onClose }: {
  initial: Partial<SOPStep> & { insertAfterId?: string };
  onSave(step: SOPStep, after?: string): void; onClose(): void;
}) {
  const [type, setType] = useState<StepType>(initial.type ?? "checklist");
  const [title, setTitle] = useState(initial.title ?? "");
  const [script, setScript] = useState(initial.script ?? "");
  const [scriptNote, setScriptNote] = useState(initial.scriptNote ?? "");
  const [items, setItems] = useState<ChecklistItem[]>(initial.checklistItems ?? []);
  const [choices, setChoices] = useState<Choice[]>(initial.choices ?? []);
  const [inputs, setInputs] = useState<InputField[]>(initial.inputs ?? []);

  const save = () => {
    if (!title.trim()) { alert("Judul wajib diisi."); return; }
    if (!script.trim()) { alert("Skrip wajib diisi."); return; }
    const step: SOPStep = {
      id: initial.id ?? uid(), title: title.trim(), script: script.trim(),
      scriptNote: scriptNote.trim() || undefined, type,
      ...(type === "checklist" && { checklistItems: items }),
      ...(type === "choice" && { choices }),
      ...(type === "input" && { inputs }),
    };
    onSave(step, initial.insertAfterId);
  };

  const TYPES: { v: StepType; label: string; Icon: React.FC<any>; color: string }[] = [
    { v: "checklist", label: "Checklist", Icon: CheckSquare, color: "bg-blue-600" },
    { v: "choice", label: "Percabangan", Icon: GitBranch, color: "bg-amber-500" },
    { v: "input", label: "Input Data", Icon: LayoutList, color: "bg-violet-600" },
    { v: "summary", label: "Ringkasan", Icon: BarChart2, color: "bg-slate-800" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-slate-900">{initial.id ? "Edit Langkah" : "Tambah Langkah Baru"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={17} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Type */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipe Node</p>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map(t => (
                <button key={t.v} onClick={() => setType(t.v)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${type === t.v ? `${t.color} text-white border-transparent shadow-lg` : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  <t.Icon size={17} />{t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Judul Node <span className="text-red-500">*</span></p>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Jenis Sertifikat?"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Skrip / Dialog Front Office <span className="text-red-500">*</span></p>
            <textarea value={script} onChange={e => setScript(e.target.value)} rows={3}
              placeholder="Kalimat yang disampaikan staf kepada klien..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Catatan Internal <span className="text-slate-400 font-normal">(opsional)</span></p>
            <input value={scriptNote} onChange={e => setScriptNote(e.target.value)} placeholder="Tips teknis untuk staf..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          {/* Checklist items */}
          {type === "checklist" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Item Checklist</p>
                <button onClick={() => setItems(p => [...p, { id: uid(), label: "", required: false }])}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:text-blue-700"><Plus size={11} /> Tambah</button>
              </div>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={it.id} className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <GripVertical size={13} className="text-slate-400 shrink-0" />
                    <input value={it.label} onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                      placeholder="Nama dokumen / item..." className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 placeholder:text-slate-400" />
                    <label className="flex items-center gap-1 text-xs text-blue-600 font-semibold shrink-0 cursor-pointer">
                      <input type="checkbox" checked={it.required} onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} className="accent-blue-600" /> Wajib
                    </label>
                    <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                  </div>
                ))}
                {items.length === 0 && <p className="text-center text-slate-400 text-xs py-3 border-2 border-dashed border-slate-200 rounded-xl">Belum ada item</p>}
              </div>
            </div>
          )}
          {/* Choices */}
          {type === "choice" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Opsi Percabangan</p>
                <button onClick={() => setChoices(p => [...p, { label: "", value: uid(), color: "slate", stateKey: "field", description: "" }])}
                  className="text-xs text-amber-600 font-semibold flex items-center gap-1 hover:text-amber-700"><Plus size={11} /> Tambah</button>
              </div>
              <div className="space-y-2.5">
                {choices.map((c, idx) => (
                  <div key={idx} className="bg-amber-50 border border-amber-100 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={c.label} onChange={e => setChoices(p => p.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                        placeholder="Label pilihan..." className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      <select value={c.color ?? "slate"} onChange={e => setChoices(p => p.map((x, i) => i === idx ? { ...x, color: e.target.value as NodeColor } : x))}
                        className="border border-amber-200 rounded-lg px-2 text-xs bg-white focus:outline-none">
                        {["blue", "amber", "green", "red", "violet", "slate"].map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                      <button onClick={() => setChoices(p => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1"><X size={13} /></button>
                    </div>
                    <input value={c.description ?? ""} onChange={e => setChoices(p => p.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))}
                      placeholder="Deskripsi pilihan (opsional)..." className="w-full bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none" />
                    <div className="flex gap-2 text-xs items-center text-slate-500">
                      <span className="shrink-0">Key:</span>
                      <input value={c.stateKey} onChange={e => setChoices(p => p.map((x, i) => i === idx ? { ...x, stateKey: e.target.value } : x))}
                        className="flex-1 bg-white border border-amber-200 rounded px-2 py-1 focus:outline-none" placeholder="stateKey" />
                      <span className="shrink-0">Value:</span>
                      <input value={c.value} onChange={e => setChoices(p => p.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))}
                        className="flex-1 bg-white border border-amber-200 rounded px-2 py-1 focus:outline-none" placeholder="value" />
                    </div>
                  </div>
                ))}
                {choices.length === 0 && <p className="text-center text-slate-400 text-xs py-3 border-2 border-dashed border-slate-200 rounded-xl">Belum ada opsi</p>}
              </div>
            </div>
          )}
          {/* Inputs */}
          {type === "input" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Field Input</p>
                <button onClick={() => setInputs(p => [...p, { key: uid(), label: "", type: "text" }])}
                  className="text-xs text-violet-600 font-semibold flex items-center gap-1 hover:text-violet-700"><Plus size={11} /> Tambah</button>
              </div>
              <div className="space-y-2.5">
                {inputs.map((f, idx) => (
                  <div key={idx} className="bg-violet-50 border border-violet-100 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={f.label} onChange={e => setInputs(p => p.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                        placeholder="Label field..." className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2 text-sm focus:outline-none" />
                      <select value={f.type} onChange={e => setInputs(p => p.map((x, i) => i === idx ? { ...x, type: e.target.value as any } : x))}
                        className="border border-violet-200 rounded-lg px-2 text-xs bg-white focus:outline-none">
                        <option value="text">Teks</option><option value="currency">Mata Uang</option><option value="number">Angka</option>
                      </select>
                      <button onClick={() => setInputs(p => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1"><X size={13} /></button>
                    </div>
                    <div className="flex gap-2">
                      <input value={f.key} onChange={e => setInputs(p => p.map((x, i) => i === idx ? { ...x, key: e.target.value } : x))}
                        placeholder="key unik (e.g. namaPembeli)" className="flex-1 bg-white border border-violet-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                      <input value={f.hint ?? ""} onChange={e => setInputs(p => p.map((x, i) => i === idx ? { ...x, hint: e.target.value } : x))}
                        placeholder="Hint opsional" className="flex-1 bg-white border border-violet-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs text-violet-700 cursor-pointer">
                      <input type="checkbox" checked={!!f.required} onChange={e => setInputs(p => p.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} className="accent-violet-600" /> Field Wajib
                    </label>
                  </div>
                ))}
                {inputs.length === 0 && <p className="text-center text-slate-400 text-xs py-3 border-2 border-dashed border-slate-200 rounded-xl">Belum ada field</p>}
              </div>
            </div>
          )}
          {type === "summary" && (
            <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
              <Info size={15} className="shrink-0 mt-0.5 text-slate-400" />
              Node Ringkasan akan otomatis menghitung estimasi biaya AJB berdasarkan input di langkah sebelumnya.
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:border-slate-300 transition">Batal</button>
          <button onClick={save} className="flex-1 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2">
            <Save size={14} /> Simpan Node
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SOP META MODAL
// ============================================================
function SOPMetaModal({ initial, onSave, onClose }: { initial: Partial<SOP>; onSave(p: Partial<SOP>): void; onClose(): void; }) {
  const [judul, setJudul] = useState(initial.judul ?? "");
  const [deskripsi, setDeskripsi] = useState(initial.deskripsi ?? "");
  const [kategori, setKategori] = useState<Kategori>(initial.kategori ?? "PPAT");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold text-slate-900">{initial.id ? "Edit Info SOP" : "SOP Baru"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><X size={17} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Judul SOP <span className="text-red-500">*</span></p>
            <input value={judul} onChange={e => setJudul(e.target.value)} placeholder="Contoh: SOP Akta Hibah"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi</p>
            <textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} rows={3} placeholder="Deskripsi singkat SOP ini..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 transition resize-none" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Kategori</p>
            <div className="flex gap-2">
              {(["PPAT", "Notaris", "Umum"] as Kategori[]).map(k => (
                <button key={k} onClick={() => setKategori(k)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${kategori === k ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>{k}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border-2 border-slate-200 rounded-xl text-slate-600 text-sm font-semibold">Batal</button>
          <button onClick={() => { if (!judul.trim()) { alert("Judul wajib diisi."); return; } onSave({ judul: judul.trim(), deskripsi: deskripsi.trim(), kategori }); }}
            className="flex-1 py-2.5 bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2">
            <Save size={14} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RUNNER VIEW
// ============================================================
interface RunnerState { sop: SOP; step: number; answers: Record<string, string>; checked: Record<string, boolean>; vals: Record<string, string>; }

const RC: Record<string, { border: string; dot: string }> = {
  blue: { border: "border-blue-500 bg-blue-50", dot: "bg-blue-500" },
  amber: { border: "border-amber-500 bg-amber-50", dot: "bg-amber-500" },
  green: { border: "border-emerald-500 bg-emerald-50", dot: "bg-emerald-500" },
  red: { border: "border-red-500 bg-red-50", dot: "bg-red-500" },
  violet: { border: "border-violet-500 bg-violet-50", dot: "bg-violet-500" },
  slate: { border: "border-slate-400 bg-slate-50", dot: "bg-slate-400" },
};

function RunnerView({ r, onNext, onPrev, onClose, setAnswer, setVal, toggleCheck }: {
  r: RunnerState; onNext(): void; onPrev(): void; onClose(): void;
  setAnswer(k: string, v: string): void; setVal(k: string, v: string): void; toggleCheck(id: string): void;
}) {
  const { sop, step, answers, checked, vals } = r;
  const s = sop.steps[step];
  const isLast = step === sop.steps.length - 1;
  const prog = ((step + 1) / sop.steps.length) * 100;

  const canProceed = () => {
    if (s.type === "checklist") return (s.checklistItems ?? []).filter(i => i.required).every(i => checked[i.id]);
    if (s.type === "choice") return (s.choices ?? []).some(c => answers[c.stateKey] !== undefined);
    if (s.type === "input") return (s.inputs ?? []).filter(f => f.required).every(f => {
      if (f.conditional && answers[f.conditional.key] !== f.conditional.value) return true;
      return (vals[f.key] ?? "").trim() !== "";
    });
    return true;
  };

  const hdrBg = s.type === "checklist" ? "bg-blue-600" : s.type === "choice" ? "bg-amber-500" : s.type === "input" ? "bg-violet-600" : "bg-slate-900";
  const hdrLabel = s.type === "checklist" ? "Checklist" : s.type === "choice" ? "Percabangan" : s.type === "input" ? "Input Data" : "Ringkasan";

  // Summary calc
  const calcSummary = () => {
    const njop = parseNumber(vals["nilaiNJOP"] ?? "0");
    const npoptkp = answers["npoptkpMode"] === "progresif" ? 0 : 80_000_000;
    const nkp = Math.max(njop - npoptkp, 0);
    const bphtb = nkp * 0.05, pph = njop * 0.025;
    const bvp = parseNumber(vals["biayaValidasiPajak"] ?? "0");
    const bp = parseNumber(vals["biayaPlotting"] ?? "0");
    const bcs = parseNumber(vals["biayaCekSertifikat"] ?? "0");
    const hAJB = parseNumber(vals["honorariumAJB"] ?? "0");
    const bAM = parseNumber(vals["biayaAlihMedia"] ?? "0");
    const isAn = answers["jenisSertifikat"] === "analog";
    const total = bphtb + pph + bcs + hAJB + (isAn ? bvp + bp + bAM : 0);
    return { njop, npoptkp, nkp, bphtb, pph, bvp, bp, bcs, hAJB, bAM, isAn, total };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col font-sans">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"><X size={16} /></button>
          <div><p className="text-xs text-slate-400">Mode Panduan</p><h2 className="text-white font-bold text-sm">{sop.judul}</h2></div>
        </div>
        <div className="hidden md:flex gap-1.5">
          {sop.steps.map((_, i) => <div key={i} className={`rounded-full transition-all duration-300 ${i === step ? "w-6 h-2.5 bg-blue-400" : i < step ? "w-2.5 h-2.5 bg-emerald-400" : "w-2.5 h-2.5 bg-white/20"}`} />)}
        </div>
        <span className="text-sm text-slate-400">{step + 1}/{sop.steps.length}</span>
      </div>
      <div className="h-1 bg-white/10"><div className="h-1 bg-blue-500 transition-all duration-500" style={{ width: `${prog}%` }} /></div>
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className={`inline-flex items-center gap-2 ${hdrBg} text-white text-xs font-bold px-3 py-1.5 rounded-full mb-4`}>
            Langkah {step + 1} — {hdrLabel}
          </div>
          <h1 className="text-2xl font-bold text-white mb-5">{s.title}</h1>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0"><span className="text-blue-300 text-xs font-bold">FO</span></div>
              <div><p className="text-xs text-slate-400 font-semibold mb-1.5">Skrip Front Office:</p><p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">{s.script}</p></div>
            </div>
          </div>
          {s.scriptNote && <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-5"><Info size={14} className="text-amber-400 shrink-0 mt-0.5" /><p className="text-amber-200 text-sm">{s.scriptNote}</p></div>}
          {s.type === "checklist" && <div className="space-y-2.5">
            {(s.checklistItems ?? []).map(it => { const ok = !!checked[it.id]; return (
              <button key={it.id} onClick={() => toggleCheck(it.id)} className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${ok ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                {ok ? <CheckCircle2 size={19} className="text-emerald-400 shrink-0" /> : <Circle size={19} className="text-slate-500 shrink-0" />}
                <span className={`text-sm font-medium ${ok ? "text-emerald-300" : "text-slate-300"}`}>{it.label}</span>
                {it.required && <span className="ml-auto text-xs text-red-400 font-medium">Wajib</span>}
              </button>); })}
          </div>}
          {s.type === "choice" && <div className="space-y-3">
            {(s.choices ?? []).map(c => { const sel = answers[c.stateKey] === c.value; const rc = RC[c.color ?? "slate"]; return (
              <button key={c.value} onClick={() => setAnswer(c.stateKey, c.value)} className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${sel ? `${rc.border} shadow-lg` : "border-white/10 bg-white/5 hover:border-white/20"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${sel ? `border-current ${rc.dot}` : "border-slate-500"}`}>{sel && <div className="w-2 h-2 bg-white rounded-full" />}</div>
                  <div><p className={`font-semibold text-sm ${sel ? "text-white" : "text-slate-200"}`}>{c.label}</p>{c.description && <p className={`text-xs mt-1 ${sel ? "text-slate-300" : "text-slate-500"}`}>{c.description}</p>}</div>
                </div>
              </button>); })}
          </div>}
          {s.type === "input" && <div className="space-y-4">
            {(s.inputs ?? []).map(f => {
              if (f.conditional && answers[f.conditional.key] !== f.conditional.value) return null;
              const raw = vals[f.key] ?? ""; const num = parseNumber(raw);
              return (<div key={f.key} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <label className="block text-sm font-semibold text-slate-300 mb-1.5">{f.label}{f.required && <span className="text-red-400 ml-1">*</span>}</label>
                <div className="relative">
                  {f.type === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>}
                  <input type="text" inputMode={f.type !== "text" ? "numeric" : "text"} value={f.type === "currency" ? formatInputNum(num) : raw} onChange={e => setVal(f.key, e.target.value)} placeholder={f.placeholder ?? ""}
                    className={`w-full bg-white/10 border border-white/20 text-white rounded-lg py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500 ${f.type === "currency" ? "pl-9 pr-4" : "px-3"}`} />
                </div>
                {f.hint && <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><Info size={11} />{f.hint}</p>}
              </div>); })}
          </div>}
          {s.type === "summary" && (() => {
            const c = calcSummary();
            const rows = [
              { l: "PPh Final (Penjual)", s: "2,5% × NJOP", v: c.pph },
              { l: "BPHTB (Pembeli)", s: "5% × NKP", v: c.bphtb },
              ...(c.isAn ? [{ l: "Biaya Validasi Pajak", s: "", v: c.bvp }, { l: "Biaya Plotting BPN", s: "", v: c.bp }] : []),
              { l: "Biaya Cek Sertifikat", s: "", v: c.bcs },
              { l: "Honorarium AJB & PPAT", s: "", v: c.hAJB },
              ...(c.isAn ? [{ l: "Biaya Alih Media", s: "Analog→Sertel", v: c.bAM }] : []),
            ];
            const copy = () => {
              const txt = `*Estimasi Biaya AJB*\n${rows.map(r => `${r.l}: ${formatRupiah(r.v)}`).join("\n")}\n\n*TOTAL: ${formatRupiah(c.total)}*\n_Estimasi — PPAT/BPN/BAPENDA Kab. Garut_`;
              navigator.clipboard.writeText(txt); alert("Disalin!");
            };
            return (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm space-y-1.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dasar Perhitungan</p>
                  {[["NPOP / NJOP", formatRupiah(c.njop)], ["NPOPTKP", `− ${formatRupiah(c.npoptkp)}`], ["NKP", formatRupiah(c.nkp)]].map(([l, v], i) => (
                    <div key={i} className={`flex justify-between ${i === 2 ? "text-white font-bold border-t border-white/10 pt-2" : "text-slate-300"}`}><span>{l}</span><span>{v}</span>
                    </div>))}
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  {rows.map((r, i) => (<div key={i} className="flex justify-between items-center px-4 py-3 border-b border-white/5">
                    <div><p className="text-sm text-slate-200 font-medium">{r.l}</p>{r.s && <p className="text-xs text-slate-500">{r.s}</p>}</div>
                    <span className={`text-sm font-bold ${r.v === 0 ? "text-slate-600" : "text-white"}`}>{formatRupiah(r.v)}</span>
                  </div>))}
                  <div className="flex justify-between items-center px-4 py-4 bg-blue-600/20 border-t border-blue-500/30">
                    <p className="text-white font-bold">TOTAL ESTIMASI</p>
                    <p className="text-blue-300 font-black text-xl">{formatRupiah(c.total)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-300 text-xs">
                  <Info size={13} className="shrink-0 mt-0.5" /><span>Estimasi awal. Angka final ditentukan PPAT, BPN, dan BAPENDA Kab. Garut.</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={copy} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl py-3 text-sm font-semibold transition-colors"><Copy size={14} /> Salin WA</button>
                  <button onClick={() => window.print()} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors shadow-lg"><Printer size={14} /> Print</button>
                </div>
              </div>);
          })()}
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={onPrev} disabled={step === 0} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /> Sebelumnya</button>
          <div className="flex-1" />
          {isLast
            ? <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-lg"><CheckCheck size={16} /> Selesai</button>
            : <button onClick={onNext} disabled={!canProceed()} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">Lanjut <ChevronRight size={16} /></button>}
        </div>
        {!canProceed() && s.type !== "summary" && <p className="text-center text-xs text-amber-400 mt-2">* Lengkapi field wajib untuk melanjutkan</p>}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function SOPPelayananPage() {
  const [sops, setSops] = useState<SOP[]>([AJB_SOP]);
  const [selId, setSelId] = useState(AJB_SOP.id);
  const [search, setSearch] = useState("");
  const [filterK, setFilterK] = useState("Semua");
  const [runner, setRunner] = useState<RunnerState | null>(null);
  const [stepModal, setStepModal] = useState<(Partial<SOPStep> & { insertAfterId?: string }) | null>(null);
  const [metaModal, setMetaModal] = useState<Partial<SOP> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("kantor_sop_v3");
    if (stored) { try { const c: SOP[] = JSON.parse(stored); setSops([AJB_SOP, ...c.filter(s => s.id !== AJB_SOP.id)]); } catch {} }
  }, []);

  const persist = (all: SOP[]) => { localStorage.setItem("kantor_sop_v3", JSON.stringify(all.filter(s => !s.isBuiltIn))); setSops(all); };

  const sel = sops.find(s => s.id === selId) ?? sops[0];
  const canEdit = !sel?.isBuiltIn;

  const saveMeta = (patch: Partial<SOP>) => {
    if (metaModal?.id) {
      persist(sops.map(s => s.id === metaModal.id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s));
    } else {
      const n: SOP = { id: `sop-${Date.now()}`, judul: patch.judul ?? "SOP Baru", deskripsi: patch.deskripsi ?? "", kategori: patch.kategori ?? "Umum", steps: [], isBuiltIn: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      const upd = [...sops, n]; persist(upd); setSelId(n.id);
    }
    setMetaModal(null);
  };

  const deleteSOP = (id: string) => { if (!confirm("Hapus SOP?")) return; const upd = sops.filter(s => s.id !== id); persist(upd); if (selId === id) setSelId(upd[0]?.id ?? ""); };

  const patchSteps = (fn: (steps: SOPStep[]) => SOPStep[]) => {
    persist(sops.map(s => s.id !== sel.id ? s : { ...s, steps: fn(s.steps), updatedAt: new Date().toISOString() }));
  };

  const saveStep = (step: SOPStep, after?: string) => {
    patchSteps(steps => {
      const idx = steps.findIndex(x => x.id === step.id);
      if (idx >= 0) { const ns = [...steps]; ns[idx] = step; return ns; }
      if (after) { const ai = steps.findIndex(x => x.id === after); const ns = [...steps]; ns.splice(ai + 1, 0, step); return ns; }
      return [...steps, step];
    });
    setStepModal(null);
  };

  const delStep = (id: string) => patchSteps(steps => steps.filter(x => x.id !== id));

  const moveStep = (id: string, dir: "up" | "down") => patchSteps(steps => {
    const ns = [...steps], i = ns.findIndex(x => x.id === id);
    if (dir === "up" && i > 0) [ns[i - 1], ns[i]] = [ns[i], ns[i - 1]];
    if (dir === "down" && i < ns.length - 1) [ns[i], ns[i + 1]] = [ns[i + 1], ns[i]];
    return ns;
  });

  const startRunner = () => sel && setRunner({ sop: sel, step: 0, answers: {}, checked: {}, vals: {} });
  const goNext = () => setRunner(p => p ? { ...p, step: Math.min(p.step + 1, p.sop.steps.length - 1) } : null);
  const goPrev = () => setRunner(p => p ? { ...p, step: Math.max(p.step - 1, 0) } : null);
  const setAnswer = (k: string, v: string) => setRunner(p => p ? { ...p, answers: { ...p.answers, [k]: v } } : null);
  const setVal = (k: string, v: string) => setRunner(p => p ? { ...p, vals: { ...p.vals, [k]: v } } : null);
  const toggleCheck = (id: string) => setRunner(p => p ? { ...p, checked: { ...p.checked, [id]: !p.checked[id] } } : null);

  if (runner) return <RunnerView r={runner} onNext={goNext} onPrev={goPrev} onClose={() => setRunner(null)} setAnswer={setAnswer} setVal={setVal} toggleCheck={toggleCheck} />;

  const filtered = sops.filter(s => {
    const mK = filterK === "Semua" || s.kategori === filterK;
    const mS = s.judul.toLowerCase().includes(search.toLowerCase());
    return mK && mS;
  });

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-100">
      {/* ── LEFT PANEL ── */}
      <div className="w-68 bg-slate-900 border-r border-slate-700/50 flex flex-col shrink-0 shadow-xl" style={{ width: 268 }}>
        <div className="px-4 pt-5 pb-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg"><ClipboardList size={16} className="text-white" /></div>
              <span className="font-bold text-white text-sm">SOP Kantor</span>
            </div>
            <button onClick={() => setMetaModal({})} className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow" title="SOP Baru"><Plus size={14} /></button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari SOP..."
              className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
        </div>
        <div className="flex gap-1 px-3 py-2.5 border-b border-slate-700/50">
          {["Semua", "PPAT", "Notaris", "Umum"].map(k => (
            <button key={k} onClick={() => setFilterK(k)}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-all ${filterK === k ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}>{k}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
          {filtered.map(s => (
            <button key={s.id} onClick={() => setSelId(s.id)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all group ${selId === s.id ? "bg-blue-600 shadow-md" : "hover:bg-slate-800"}`}>
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${selId === s.id ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"}`}>{s.kategori}</span>
                  {s.isBuiltIn && <span className={`text-xs ${selId === s.id ? "text-blue-200" : "text-amber-400"}`}>★</span>}
                </div>
                {!s.isBuiltIn && (
                  <button onClick={e => { e.stopPropagation(); deleteSOP(s.id); }}
                    className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${selId === s.id ? "text-blue-200 hover:text-white hover:bg-white/20" : "text-slate-500 hover:text-red-400 hover:bg-red-900/30"}`}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <p className={`text-xs font-semibold leading-snug ${selId === s.id ? "text-white" : "text-slate-300"}`}>{s.judul}</p>
              <p className={`text-xs mt-0.5 ${selId === s.id ? "text-blue-200" : "text-slate-500"}`}>{s.steps.length} node</p>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-center py-6 text-slate-500 text-xs">Tidak ada SOP</p>}
        </div>
      </div>

      {/* ── RIGHT PANEL: FLOWCHART ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Toolbar */}
        {sel && (
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-3 shrink-0 shadow-sm">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${KATEGORI_COLORS[sel.kategori]}`}>{sel.kategori}</span>
                {sel.isBuiltIn && <span className="text-xs text-amber-500 font-semibold">★ Built-in (read-only)</span>}
              </div>
              <h1 className="text-sm font-bold text-slate-900 truncate">{sel.judul}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!sel.isBuiltIn && <button onClick={() => setMetaModal(sel)} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:border-slate-300 transition-colors flex items-center gap-1.5"><Edit2 size={12} /> Edit Info</button>}
              {canEdit && <button onClick={() => setStepModal({})} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"><Plus size={13} /> Tambah Node</button>}
              <button onClick={startRunner} disabled={sel.steps.length === 0}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5">
                <Play size={13} /> Jalankan SOP
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {!sel ? (
            <div className="flex items-center justify-center h-full text-slate-400"><p>Pilih SOP dari panel kiri</p></div>
          ) : sel.steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center"><ClipboardList size={32} className="text-slate-300" /></div>
              <div className="text-center"><p className="font-semibold text-slate-600 mb-1">Diagram masih kosong</p><p className="text-sm text-slate-400 mb-4">Tambahkan node pertama untuk memulai workflow</p>
                {canEdit && <button onClick={() => setStepModal({})} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow"><Plus size={14} /> Tambah Node Pertama</button>}
              </div>
            </div>
          ) : (
            <div className="px-8 py-8 min-h-full">
              {/* Legend */}
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                {[
                  { color: "bg-blue-600", label: "Checklist" },
                  { color: "bg-amber-500", label: "Percabangan (◇)" },
                  { color: "bg-violet-600", label: "Input Data" },
                  { color: "bg-slate-800", label: "Ringkasan" },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2 text-xs text-slate-500">
                    <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                    {l.label}
                  </div>
                ))}
                {canEdit && <span className="ml-auto text-xs text-slate-400 flex items-center gap-1"><Info size={11} /> Hover node untuk Edit / Hapus / Pindah</span>}
              </div>
              <FlowchartCanvas
                sop={sel} canEdit={canEdit}
                onEditStep={s => setStepModal(s)}
                onDeleteStep={delStep}
                onMoveStep={moveStep}
                onAddStep={after => setStepModal(after ? { insertAfterId: after } : {})}
              />
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {stepModal !== null && <StepEditorModal initial={stepModal} onSave={saveStep} onClose={() => setStepModal(null)} />}
      {metaModal !== null && <SOPMetaModal initial={metaModal} onSave={saveMeta} onClose={() => setMetaModal(null)} />}
    </div>
  );
}
