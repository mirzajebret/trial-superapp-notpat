'use server';

import fs from 'fs/promises';
import path from 'path';
import { revalidatePath } from 'next/cache';

const MATERAI_PATH = path.join(process.cwd(), 'data', 'materai.json');

export type MateraiType = 'Masuk' | 'Keluar';

export interface MateraiRecord {
  id: string;
  type: MateraiType;
  tanggal: string;
  nominal: number;
  jumlah: number;
  keterangan?: string;
  // Masuk specific
  sumberPembelian?: string;
  // Keluar specific
  digunakanUntuk?: string;
  createdAt: string;
  updatedAt?: string;
}

async function ensureFile() {
  try {
    await fs.access(MATERAI_PATH);
  } catch {
    const dir = path.dirname(MATERAI_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(MATERAI_PATH, JSON.stringify([], null, 2));
  }
}

async function readRecords(): Promise<MateraiRecord[]> {
  await ensureFile();
  const data = await fs.readFile(MATERAI_PATH, 'utf8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRecords(records: MateraiRecord[]) {
  await fs.writeFile(MATERAI_PATH, JSON.stringify(records, null, 2));
}

export async function getMateraiRecords(): Promise<MateraiRecord[]> {
  const records = await readRecords();
  return records.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
}

export async function addMaterai(data: Omit<MateraiRecord, 'id' | 'createdAt'>): Promise<{ success: boolean; data?: MateraiRecord; error?: string }> {
  try {
    const records = await readRecords();
    const newRecord: MateraiRecord = {
      id: `MAT-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    records.push(newRecord);
    await writeRecords(records);
    revalidatePath('/modules/pencatatan-materai');
    return { success: true, data: newRecord };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function updateMaterai(id: string, data: Partial<Omit<MateraiRecord, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readRecords();
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) return { success: false, error: 'Record tidak ditemukan.' };
    records[idx] = {
      ...records[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await writeRecords(records);
    revalidatePath('/modules/pencatatan-materai');
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function deleteMaterai(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const records = await readRecords();
    const filtered = records.filter((r) => r.id !== id);
    if (filtered.length === records.length) return { success: false, error: 'Record tidak ditemukan.' };
    await writeRecords(filtered);
    revalidatePath('/modules/pencatatan-materai');
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return { success: false, error: message };
  }
}
