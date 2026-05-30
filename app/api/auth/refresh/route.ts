import type { NextRequest } from 'next/server'
import { refreshAccessToken, GoogleOAuthError } from '@/lib/google-oauth'
import { corsHeaders } from '@/lib/http-utils'

// Handle CORS preflight
export function OPTIONS(request: NextRequest): Response {
  const origin = request.headers.get('origin')
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

export async function POST(request: NextRequest): Promise<Response> {
  const headers = corsHeaders(request.headers.get('origin'))
  let body: { refresh_token?: string }

  try {
    body = (await request.json()) as { refresh_token?: string }
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400, headers })
  }

  const { refresh_token } = body

  if (!refresh_token || typeof refresh_token !== 'string') {
    return Response.json({ error: 'missing_refresh_token' }, { status: 400, headers })
  }

  try {
    const { access_token, expires_in } = await refreshAccessToken(refresh_token)
    return Response.json({ access_token, expires_in }, { headers })
  } catch (err) {
    // Surface the actual Google error code (e.g. "invalid_grant") so the
    // plugin can distinguish a revoked token from a transient network error.
    const code = err instanceof GoogleOAuthError ? err.code : 'refresh_failed'
    return Response.json({ error: code }, { status: 400, headers })
  }
}
