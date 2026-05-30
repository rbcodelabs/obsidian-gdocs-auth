import type { NextRequest } from 'next/server'
import { refreshAccessToken, GoogleOAuthError } from '@/lib/google-oauth'

// Obsidian desktop runs from app://obsidian.md — allow it explicitly.
// This is the only origin that should be calling this endpoint.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'app://obsidian.md',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Handle CORS preflight
export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: NextRequest): Promise<Response> {
  let body: { refresh_token?: string }

  try {
    body = (await request.json()) as { refresh_token?: string }
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers: CORS_HEADERS })
  }

  const { refresh_token } = body

  if (!refresh_token || typeof refresh_token !== 'string') {
    return Response.json({ error: 'missing_refresh_token' }, { status: 400, headers: CORS_HEADERS })
  }

  try {
    const { access_token, expires_in } = await refreshAccessToken(refresh_token)
    return Response.json({ access_token, expires_in }, { headers: CORS_HEADERS })
  } catch (err) {
    // Surface the actual Google error code (e.g. "invalid_grant") so the
    // plugin can distinguish a revoked token from a transient network error.
    const code = err instanceof GoogleOAuthError ? err.code : 'refresh_failed'
    return Response.json({ error: code }, { status: 400, headers: CORS_HEADERS })
  }
}
