import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { exchangeCode, GoogleOAuthError } from '@/lib/google-oauth'
import type { GoogleTokens } from '@/lib/google-oauth'
import { htmlErrorResponse } from '@/lib/http-utils'

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return htmlErrorResponse('Missing code or state parameter.')
  }

  let tokens: GoogleTokens
  try {
    tokens = await exchangeCode(code)
  } catch (err) {
    // Surface the Google error code when available so the user sees something
    // actionable (e.g. "access_denied") rather than a raw exception message.
    const detail =
      err instanceof GoogleOAuthError
        ? `Token exchange failed: ${err.code}`
        : 'Token exchange failed. Please try signing in again.'
    return htmlErrorResponse(detail)
  }

  // Pass tokens directly in the obsidian:// URI — the plugin protocol handler
  // extracts them immediately. State is returned so the plugin can verify it
  // matches what it originally generated (CSRF check, client-side).
  // Note: Obsidian reserves the "action" query param (it gets overwritten with
  // the handler name). Use "event" instead to carry our callback type.
  const params = new URLSearchParams({
    event: 'auth_complete',
    state,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: String(tokens.expires_in),
  })

  // redirect() is called outside any try/catch — it throws NEXT_REDIRECT internally.
  redirect(`obsidian://gdocs-sync?${params.toString()}`)
}
