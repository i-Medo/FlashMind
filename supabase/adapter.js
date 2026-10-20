// Minimal Supabase data layer (plain fetch/PostgREST — smaller than the SDK).
// Mirrors the app's local-store interface. Paste keys in CONFIG below.
const SupaStore = (() => {
  const CONFIG = {
    SUPABASE_URL: 'https://YOUR_REF.supabase.co', // <-- paste project URL
    SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',            // <-- paste anon key
  };
  let session = null; // { access_token } set after sign-in

  async function req(path, { method = 'GET', body } = {}) {
    const res = await fetch(CONFIG.SUPABASE_URL + '/rest/v1' + path, {
      method,
      headers: {
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + (session ? session.access_token : CONFIG.SUPABASE_ANON_KEY),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error('supabase ' + res.status + ': ' + (await res.text()).slice(0, 200));
    return res.status === 204 ? null : res.json();
  }

  // Email sign-in (single user). No signup UI — create the user in the dashboard.
  async function signIn(email, password) {
    const res = await fetch(CONFIG.SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('sign-in failed');
    session = await res.json();
    return session.user;
  }

  const one = rows => (Array.isArray(rows) && rows.length ? rows[0] : null);

  return {
    signIn,
    listDecks:   () => req('/decks?select=*&order=created_at'),
    getDeck:     id => req('/decks?id=eq.' + id + '&select=*').then(one),
    saveDeck:    d => d.id
      ? req('/decks?id=eq.' + d.id, { method: 'PATCH', body: d }).then(one)
      : req('/decks', { method: 'POST', body: d }).then(one),
    listCards:   deckId => req('/cards?deck_id=eq.' + deckId + '&select=*&order=created_at'),
    saveCard:    c => c.id
      ? req('/cards?id=eq.' + c.id, { method: 'PATCH', body: c }).then(one)
      : req('/cards', { method: 'POST', body: c }).then(one),
    deleteCard:  id => req('/cards?id=eq.' + id, { method: 'DELETE' }),
    listMistakes: status => req('/mistakes?select=*' + (status ? '&status=eq.' + status : '') + '&order=created_at.desc'),
    saveMistake: m => m.id
      ? req('/mistakes?id=eq.' + m.id, { method: 'PATCH', body: m }).then(one)
      : req('/mistakes', { method: 'POST', body: m }).then(one),
    clearMistake: id => req('/mistakes?id=eq.' + id, { method: 'PATCH', body: { status: 'cleared' } }).then(one),
    logReview:   (cardId, rating) => req('/reviews', { method: 'POST', body: { card_id: cardId, rating } }).then(one),
  };
})();
