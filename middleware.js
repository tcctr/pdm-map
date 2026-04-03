// Vercel Edge Middleware — HTTP Basic Auth (env var credentials + Vercel KV paid users)
// Set BASIC_AUTH_CREDENTIALS in Vercel environment variables as a comma-separated
// list of user:password pairs, e.g.:
//   Tiago:abc123,Rui:xyz789
// Paid users are stored in Vercel KV under the key cred:{username}.

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

// Routes that require no authentication
function isPublic(pathname) {
  if (pathname === '/' || pathname === '/index.html' || pathname === '/favicon.svg') return true;
  if (pathname.startsWith('/api/'))    return true;  // API functions handle their own logic
  if (pathname.startsWith('/success')) return true;  // success page fetches /api/verify-session
  return false;
}

export default async function middleware(request) {
  const { pathname } = new URL(request.url);
  if (isPublic(pathname)) return;

  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Basic ')) return unauthorized();

  let user, pass;
  try {
    const decoded  = atob(authHeader.slice(6));
    const colonIdx = decoded.indexOf(':');
    user = decoded.slice(0, colonIdx);
    pass = decoded.slice(colonIdx + 1);
  } catch {
    return unauthorized();
  }

  // ── Step 1: check hardcoded env var credentials (admin / test users) ──
  const credsEnv = process.env.BASIC_AUTH_CREDENTIALS;
  if (credsEnv) {
    const valid = new Map(
      credsEnv.split(',').map(entry => {
        const i = entry.indexOf(':');
        return [entry.slice(0, i).trim(), entry.slice(i + 1).trim()];
      })
    );
    if (valid.get(user) === pass) return; // allow
  }

  // ── Step 2: check Vercel KV for paid user credentials ──
  const kvUrl   = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !kvToken) return unauthorized();

  try {
    const resp = await fetch(
      `${kvUrl}/get/${encodeURIComponent(`cred:${user}`)}`,
      { headers: { Authorization: `Bearer ${kvToken}` } }
    );

    if (!resp.ok) return unauthorized();

    const { result } = await resp.json();
    if (!result) return unauthorized();

    // @vercel/kv serialises objects as JSON strings in the REST response
    const cred = typeof result === 'string' ? JSON.parse(result) : result;
    if (cred.password !== pass) return unauthorized();

    return; // allow
  } catch {
    return unauthorized(); // fail closed on any KV error
  }
}

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Mapear", charset="UTF-8"' },
  });
}
