import { redirect } from 'next/navigation'
import type { NextRequest } from 'next/server'
import { exchangeCode } from '@/lib/google-oauth'
import type { GoogleTokens } from '@/lib/google-oauth'

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return new Response(
      '<html><body><h1>OAuth Error</h1><p>Missing code or state parameter.</p></body></html>',
      { status: 400, headers: { 'Content-Type': 'text/html' } },
    )
  }

  let tokens: GoogleTokens
  try {
    tokens = await exchangeCode(code)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      `<html><body><h1>OAuth Error</h1><p>Token exchange failed: ${message}</p></body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } },
    )
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
