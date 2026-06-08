// Allowed origins for the /api/auth/refresh CORS endpoint.
// Obsidian runs in different webview contexts depending on platform.
export const ALLOWED_ORIGINS = new Set([
  'app://obsidian.md',       // Desktop (Electron)
  'capacitor://localhost',   // iOS (Capacitor)
  'http://localhost',        // Android (Capacitor)
])

/**
 * Returns CORS response headers for the token refresh endpoint.
 *
 * Reflects the request origin back only if it is on the allowlist, so the
 * browser accepts the response. Unknown origins fall back to the desktop
 * origin, which effectively blocks them (since the browser won't match).
 *
 * `Vary: Origin` is included so CDN caches don't serve the wrong origin's
 * response to a different caller.
 */
export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'app://obsidian.md'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  }
}

/**
 * Escapes a string for safe interpolation into an HTML text node.
 * Handles the five characters that are meaningful in HTML/XML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/** Returns a minimal HTML error page with the given message safely escaped. */
export function htmlErrorResponse(detail: string): Response {
  return new Response(
    `<html><body><h1>OAuth Error</h1><p>${escapeHtml(detail)}</p></body></html>`,
    { status: 400, headers: { 'Content-Type': 'text/html' } },
  )
}
