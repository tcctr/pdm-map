// Vercel Edge Middleware — HTTP Basic Auth (multi-user)
// Set BASIC_AUTH_CREDENTIALS in Vercel environment variables as a comma-separated
// list of user:password pairs, e.g.:
//   Tiago:abc123,Rui:xyz789,Beta-tester_1:foo,Beta-tester_2:bar,Beta-tester_3:baz
// Falls closed (500) if the variable is not configured.

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

export default function middleware(request) {
  const credsEnv = process.env.BASIC_AUTH_CREDENTIALS;

  // Fail closed: if credentials are not configured, deny everything
  if (!credsEnv) {
    return new Response('Server misconfiguration: auth not configured.', { status: 500 });
  }

  // Parse "user:pass,user:pass,..." into a Map
  const validCredentials = new Map(
    credsEnv.split(',').map(entry => {
      const colonIdx = entry.indexOf(':');
      return [entry.slice(0, colonIdx).trim(), entry.slice(colonIdx + 1).trim()];
    })
  );

  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const colonIdx = decoded.indexOf(':');
      const user = decoded.slice(0, colonIdx);
      const pass = decoded.slice(colonIdx + 1);
      if (validCredentials.get(user) === pass) {
        return; // allow through
      }
    } catch {
      // malformed base64 — fall through to 401
    }
  }

  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Mapear", charset="UTF-8"',
    },
  });
}
