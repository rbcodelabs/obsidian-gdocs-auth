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

  // Pass tokens in the obsidian:// URI — the plugin protocol handler extracts
  // them immediately. State is returned so the plugin can verify it matches
  // what it originally generated (CSRF check, client-side).
  // Note: Obsidian reserves the "action" query param (it gets overwritten with
  // the handler name). Use "event" instead to carry our callback type.
  const params = new URLSearchParams({
    event: 'auth_complete',
    state,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: String(tokens.expires_in),
  })

  const obsidianUri = `obsidian://gdocs-sync?${params.toString()}`

  // Redirect to the success page, which fires the obsidian:// URI via client-side
  // JS and shows a "you can close this tab" screen. A bare server-side redirect to
  // obsidian:// leaves the browser tab in a blank/broken state.
  redirect(`/auth/success?obsidian_uri=${encodeURIComponent(obsidianUri)}`)
}
