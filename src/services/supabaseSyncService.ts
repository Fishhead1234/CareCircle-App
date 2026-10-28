export interface CloudLedgerPayload {
  app: string;
  version: string;
  updatedAt: string;
  language?: string;
  currencyCode?: string;
  currencySymbol?: string;
  recipient: any;
  members: any[];
  fundContributions: any[];
  expenses: any[];
  settlements: any[];
  shifts: any[];
  medications: any[];
  deletedIds?: string[];
}

export interface CloudRoomRecord {
  room_code: string;
  family_name: string;
  ledger_json: CloudLedgerPayload;
  updated_at: string;
}

const BUILTIN_SUPABASE_URL = 'https://muluvbiizqtitctgcebt.supabase.co';
const BUILTIN_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11bHV2YmlpenF0aXRjdGdjZWJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxODEwMDgsImV4cCI6MjEwODc1NzAwOH0.T9hAYAYtRgGIOq9d1H8F0OwVKoeYd-tWNL8vC2X8Ufo';
const BUILTIN_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_pzmszFbzWinm5_pJ4SJKWg_joAgjGI3';

const ENV_SUPABASE_URL: string =
  (import.meta as any).env?.VITE_SUPABASE_URL || BUILTIN_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY: string =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || BUILTIN_SUPABASE_ANON_KEY;

const STORAGE_KEY_SB_URL = 'carecircle_supabase_url';
const STORAGE_KEY_SB_KEY = 'carecircle_supabase_anon_key';

// Fallback keys if user previously configured Supabase in the same browser
const LEGACY_SB_URL = 'inspecta_custom_supabase_url';
const LEGACY_SB_KEY = 'inspecta_custom_supabase_anon_key';

function cleanSupabaseBaseUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

export const SUPABASE_SQL_SCHEMA = `-- Run this once in your Supabase SQL Editor (https://supabase.com/dashboard)
create table if not exists public.care_family_rooms (
  room_code text primary key,
  family_name text not null default 'Family Care Hub',
  ledger_json jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.care_family_rooms enable row level security;

drop policy if exists "Allow anon select care_family_rooms" on public.care_family_rooms;
create policy "Allow anon select care_family_rooms"
  on public.care_family_rooms for select to anon, authenticated using (true);

drop policy if exists "Allow anon insert care_family_rooms" on public.care_family_rooms;
create policy "Allow anon insert care_family_rooms"
  on public.care_family_rooms for insert to anon, authenticated with check (true);

drop policy if exists "Allow anon update care_family_rooms" on public.care_family_rooms;
create policy "Allow anon update care_family_rooms"
  on public.care_family_rooms for update to anon, authenticated using (true) with check (true);`;

export function normalizeRoomCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
}

export function getSupabaseConfig(): { url: string; anonKey: string } {
  if (typeof window === 'undefined') {
    return {
      url: cleanSupabaseBaseUrl(ENV_SUPABASE_URL),
      anonKey: ENV_SUPABASE_ANON_KEY.trim(),
    };
  }

  const savedUrl =
    localStorage.getItem(STORAGE_KEY_SB_URL) ||
    localStorage.getItem(LEGACY_SB_URL) ||
    '';
  const savedKey =
    localStorage.getItem(STORAGE_KEY_SB_KEY) ||
    localStorage.getItem(LEGACY_SB_KEY) ||
    '';

  const url = cleanSupabaseBaseUrl(savedUrl || ENV_SUPABASE_URL);
  const anonKey = (savedKey || ENV_SUPABASE_ANON_KEY).trim();

  return { url, anonKey };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  const cleanUrl = cleanSupabaseBaseUrl(url);
  const cleanKey = anonKey.trim();

  if (cleanUrl) {
    localStorage.setItem(STORAGE_KEY_SB_URL, cleanUrl);
  } else {
    localStorage.removeItem(STORAGE_KEY_SB_URL);
  }

  if (cleanKey) {
    localStorage.setItem(STORAGE_KEY_SB_KEY, cleanKey);
  } else {
    localStorage.removeItem(STORAGE_KEY_SB_KEY);
  }
}

export function isSupabaseReady(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('https://'));
}

function getHeaders(anonKey: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

async function fetchWithKeyFallback(
  url: string,
  primaryKey: string,
  init: Omit<RequestInit, 'headers'>,
  extraHeaders?: Record<string, string>
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: getHeaders(primaryKey, extraHeaders),
  });

  if (res.status === 401 && primaryKey !== BUILTIN_SUPABASE_PUBLISHABLE_KEY) {
    return fetch(url, {
      ...init,
      headers: getHeaders(BUILTIN_SUPABASE_PUBLISHABLE_KEY, extraHeaders),
    });
  }

  return res;
}

export const supabaseSyncService = {
  /**
   * Fetch a family room by room_code from `care_family_rooms`.
   * If `care_family_rooms` table hasn't been created yet, tries fallback table `inspections` if available.
   */
  async fetchRoom(roomCode: string): Promise<{
    found: boolean;
    record?: CloudRoomRecord;
    needsTableSetup?: boolean;
    error?: string;
  }> {
    const cleanCode = normalizeRoomCode(roomCode);
    const { url, anonKey } = getSupabaseConfig();

    if (!url || !anonKey || !url.startsWith('https://')) {
      return { found: false, error: 'Supabase URL and Anon Key are required.' };
    }

    try {
      const endpoint = `${url}/rest/v1/care_family_rooms?room_code=eq.${encodeURIComponent(cleanCode)}&select=*`;
      const res = await fetchWithKeyFallback(endpoint, anonKey, { method: 'GET' });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return { found: true, record: rows[0] as CloudRoomRecord };
        }
        return { found: false };
      }

      const errBody = await res.text();
      // If care_family_rooms table does not exist yet, try fallback table `inspections`
      if (res.status === 404 || errBody.includes('PGRST205') || errBody.includes('care_family_rooms')) {
        const fallbackId = `carecircle_room_${cleanCode}`;
        const fbRes = await fetchWithKeyFallback(
          `${url}/rest/v1/inspections?id=eq.${encodeURIComponent(fallbackId)}&select=*`,
          anonKey,
          { method: 'GET' }
        );

        if (fbRes.ok) {
          const fbRows = await fbRes.json();
          if (Array.isArray(fbRows) && fbRows.length > 0) {
            const row = fbRows[0];
            return {
              found: true,
              record: {
                room_code: cleanCode,
                family_name: row.property_address || 'Family Care Hub',
                ledger_json: row.report_json as CloudLedgerPayload,
                updated_at: row.updated_at || new Date().toISOString(),
              },
            };
          }
          return { found: false };
        }

        return {
          found: false,
          needsTableSetup: true,
          error: 'Table public.care_family_rooms not found. Please run the SQL setup script in Supabase SQL Editor.',
        };
      }

      return { found: false, error: `Supabase error (${res.status}): ${errBody}` };
    } catch (e: any) {
      return {
        found: false,
        error: e?.message || 'Network error connecting to Supabase.',
      };
    }
  },

  /**
   * Upsert a family room record into `care_family_rooms` (with automatic fallback to `inspections` if needed).
   */
  async upsertRoom(
    roomCode: string,
    familyName: string,
    payload: CloudLedgerPayload
  ): Promise<{ success: boolean; updatedAt?: string; needsTableSetup?: boolean; error?: string }> {
    const cleanCode = normalizeRoomCode(roomCode);
    const { url, anonKey } = getSupabaseConfig();

    if (!url || !anonKey || !url.startsWith('https://')) {
      return { success: false, error: 'Supabase URL and Anon Key are required.' };
    }

    const nowIso = new Date().toISOString();
    const record: CloudRoomRecord = {
      room_code: cleanCode,
      family_name: familyName || 'Family Care Hub',
      ledger_json: {
        ...payload,
        updatedAt: nowIso,
      },
      updated_at: nowIso,
    };

    try {
      const endpoint = `${url}/rest/v1/care_family_rooms?on_conflict=room_code`;
      const res = await fetchWithKeyFallback(
        endpoint,
        anonKey,
        {
          method: 'POST',
          body: JSON.stringify(record),
        },
        {
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }
      );

      if (res.ok) {
        return { success: true, updatedAt: nowIso };
      }

      const errBody = await res.text();
      if (res.status === 404 || errBody.includes('PGRST205') || errBody.includes('care_family_rooms')) {
        // Try fallback to `public.inspections` if user shares the same Supabase project
        const fallbackId = `carecircle_room_${cleanCode}`;
        const fbRes = await fetchWithKeyFallback(
          `${url}/rest/v1/inspections?on_conflict=id`,
          anonKey,
          {
            method: 'POST',
            body: JSON.stringify({
              id: fallbackId,
              property_address: familyName || 'Family Care Hub',
              report_json: record.ledger_json,
              updated_at: nowIso,
            }),
          },
          {
            Prefer: 'resolution=merge-duplicates,return=minimal',
          }
        );

        if (fbRes.ok) {
          return { success: true, updatedAt: nowIso };
        }

        return {
          success: false,
          needsTableSetup: true,
          error: 'Table public.care_family_rooms not found. Please run the SQL setup script in Supabase SQL Editor.',
        };
      }

      return { success: false, error: `Supabase upsert failed (${res.status}): ${errBody}` };
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || 'Network error pushing to Supabase.',
      };
    }
  },
};

