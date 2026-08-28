function supabaseConfig() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = String(process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

function validationError(message, status = 400, code = 'invalid_request') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

async function parseRest(res) {
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { message: text };
    }
  }
  if (!res.ok) {
    const err = validationError(
      data?.message || data?.error_description || 'Study data request failed',
      res.status >= 400 && res.status < 600 ? res.status : 502,
      data?.code || 'study_store_error'
    );
    throw err;
  }
  return data;
}

export function createUserDataClient(accessToken) {
  const cfg = supabaseConfig();
  if (!cfg) {
    throw validationError('Study storage is unavailable', 500, 'auth_not_configured');
  }
  if (!accessToken) {
    throw validationError('Session expired', 401, 'session_expired');
  }

  const headers = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  async function request(path, { method = 'GET', query = '', body, prefer, range } = {}) {
    const url = `${cfg.url}/rest/v1/${path}${query ? `?${query}` : ''}`;
    const reqHeaders = { ...headers };
    if (prefer) reqHeaders.Prefer = prefer;
    if (range) reqHeaders.Range = range;
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body == null ? undefined : JSON.stringify(body)
    });
    return { res, data: await parseRest(res), count: parseCount(res) };
  }

  return {
    async select(table, query, extra = {}) {
      const { data, count } = await request(table, { method: 'GET', query, ...extra });
      return { rows: Array.isArray(data) ? data : [], count };
    },
    async insert(table, row) {
      const { data } = await request(table, {
        method: 'POST',
        body: row,
        prefer: 'return=representation'
      });
      return Array.isArray(data) ? data[0] : data;
    },
    async upsert(table, row, onConflict) {
      const { data } = await request(table, {
        method: 'POST',
        body: row,
        prefer: `return=representation,resolution=merge-duplicates`,
        query: onConflict ? `on_conflict=${encodeURIComponent(onConflict)}` : ''
      });
      return Array.isArray(data) ? data[0] : data;
    },
    async patch(table, query, row) {
      const { data } = await request(table, {
        method: 'PATCH',
        query,
        body: row,
        prefer: 'return=representation'
      });
      return Array.isArray(data) ? data[0] || null : data;
    },
    async remove(table, query) {
      const { data } = await request(table, {
        method: 'DELETE',
        query,
        prefer: 'return=representation'
      });
      return Array.isArray(data) ? data : [];
    },
    async count(table, query) {
      const { count } = await request(table, {
        method: 'GET',
        query: query ? `${query}&select=id` : 'select=id',
        prefer: 'count=exact',
        range: '0-0'
      });
      return Number(count) || 0;
    },
    async insertMany(table, rows) {
      const { data } = await request(table, {
        method: 'POST',
        body: rows,
        prefer: 'return=representation'
      });
      return Array.isArray(data) ? data : (data ? [data] : []);
    },
    async rpc(fn, args) {
      const { data } = await request(`rpc/${fn}`, {
        method: 'POST',
        body: args
      });
      return data;
    }
  };
}

function parseCount(res) {
  const header = res.headers.get('content-range') || '';
  const match = /\/(\d+|\*)$/.exec(header);
  if (!match || match[1] === '*') return null;
  return Number(match[1]);
}

export async function ensureOwnProfile(db, user) {
  if (!user?.id) return;
  try {
    await db.upsert(
      'profiles',
      {
        id: user.id,
        email: user.email || null
      },
      'id'
    );
  } catch (_err) {
    // Profile trigger usually wins; ignore conflict/RLS misses here.
  }
}
