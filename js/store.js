// ===== Store: storage adapter (personal build) =====
// Single place for persisted key/value data. It mirrors the
// getItem/setItem/removeItem contract of localStorage so callers don't change.
//
// BACKEND = 'local' today. To move to Supabase later: implement the three
// methods against Supabase (stub below), flip the flag, and note the
// Supabase backend will need to be async — callers must be updated then.
const Store = (() => {
  const BACKEND = 'local'; // 'local' | 'supabase'

  const local = {
    getItem(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    setItem(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    removeItem(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  // --- Supabase backend (see supabase/adapter.js — already drafted) ---
  // The intended Supabase backend lives in supabase/adapter.js (SupaStore):
  // schema in supabase/schema.sql (decks/cards/mistakes/reviews tables with
  // RLS), plain-fetch PostgREST, no SDK. To switch: make SupaStore expose the
  // same getItem/setItem/removeItem contract (it will need to be async —
  // callers must be updated then), add it to `backends` below, and flip
  // BACKEND to 'supabase'. Until then the deck blob stays in localStorage and
  // the agent card-writing path goes through PostgREST directly per
  // supabase/README.md.
  const backends = { local /*, supabase: SupaStore */ };
  const active = backends[BACKEND] || local;

  return {
    getItem: active.getItem,
    setItem: active.setItem,
    removeItem: active.removeItem,
    backend: BACKEND
  };
})();
