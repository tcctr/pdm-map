// Vercel Edge Middleware — HTTP Basic Auth
// Set BASIC_AUTH_USER and BASIC_AUTH_PASSWORD in Vercel project environment variables.
// Falls back to denying all requests if BASIC_AUTH_PASSWORD is not configured.

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

export default function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USER || 'mapear';
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;

  // Fail closed: if no password is configured, deny everything
  if (!expectedPass) {
    return new Response('Server misconfiguration: auth not configured.', { status: 500 });
  }

  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.slice(6));
      const colonIdx = decoded.indexOf(':');
      const user = decoded.slice(0, colonIdx);
      const pass = decoded.slice(colonIdx + 1);
      if (user === expectedUser && pass === expectedPass) {
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
