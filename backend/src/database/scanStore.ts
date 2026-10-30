import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Scan } from '../models/Scan';
import { isDbConnected } from './connection';

const FALLBACK_DIR = path.resolve(__dirname, '../../data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'scans_fallback.json');

function ensureFallbackFile() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify([]));
  }
}

export async function saveScanRecord(data: any): Promise<string> {
  if (isDbConnected()) {
    try {
      const scanDoc = new Scan(data);
      const saved = await scanDoc.save();
      return saved._id.toString();
    } catch (e: any) {
      console.warn('[ScanStore] MongoDB save warning, falling back to local storage:', e.message);
    }
  }

  // Fallback persistence
  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
    const list = JSON.parse(raw || '[]');
    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      _id: scanId,
      ...data,
      created_at: data.created_at || new Date().toISOString(),
    };
    list.unshift(record);
    // Keep last 500 scans in fallback cache
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(list.slice(0, 500), null, 2));
    return scanId;
  } catch (err: any) {
    console.error('[ScanStore] Fallback save failed:', err.message);
    return `scan_${Date.now()}`;
  }
}

export async function getScanRecords(
  filter: any = {},
  options: { page?: number; limit?: number; search?: string } = {}
) {
  const page = options.page || 1;
  const limit = options.limit || 10;

  if (isDbConnected()) {
    try {
      const query: any = {};
      if (filter.verdict) query.verdict = filter.verdict;
      if (filter.user_id) query.user_id = filter.user_id;
      if (options.search) {
        query.$or = [
          { original_url: { $regex: options.search, $options: 'i' } },
          { normalized_url: { $regex: options.search, $options: 'i' } },
        ];
      }

      const total = await Scan.countDocuments(query);
      const scans = await Scan.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
      return { scans, total, page, pages: Math.ceil(total / limit) || 1 };
    } catch (e: any) {
      console.warn('[ScanStore] MongoDB query warning, reading fallback:', e.message);
    }
  }

  // Read from fallback file
  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
    let list: any[] = JSON.parse(raw || '[]');
    if (filter.verdict) {
      list = list.filter((s) => s.verdict === filter.verdict);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.original_url?.toLowerCase().includes(q) ||
          s.normalized_url?.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);
    return { scans: paginated, total, page, pages: Math.ceil(total / limit) || 1 };
  } catch {
    return { scans: [], total: 0, page: 1, pages: 1 };
  }
}

export async function findScanById(id: string) {
  if (isDbConnected() && mongoose.isValidObjectId(id)) {
    try {
      const found = await Scan.findById(id).lean();
      if (found) return found;
    } catch {}
  }

  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
    const list: any[] = JSON.parse(raw || '[]');
    return list.find((s) => s._id === id || s.scanId === id) || null;
  } catch {
    return null;
  }
}

export async function deleteScanRecord(id: string): Promise<boolean> {
  let deleted = false;
  if (isDbConnected() && mongoose.isValidObjectId(id)) {
    try {
      await Scan.findByIdAndDelete(id);
      deleted = true;
    } catch {}
  }

  ensureFallbackFile();
  try {
    const raw = fs.readFileSync(FALLBACK_FILE, 'utf8');
    const list: any[] = JSON.parse(raw || '[]');
    const nextList = list.filter((s) => s._id !== id && s.scanId !== id);
    if (nextList.length !== list.length) {
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(nextList, null, 2));
      deleted = true;
    }
  } catch {}

  return deleted;
}
