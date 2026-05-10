import type { NextRequest } from 'next/server'
import { refreshAccessToken } from '@/lib/google-oauth'

export async function POST(request: NextRequest): Promise<Response> {
  let body: { refresh_token?: string }

  try {
    body = (await request.json()) as { refresh_token?: string }
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { refresh_token } = body

  if (!refresh_token || typeof refresh_token !== 'string') {
    return Response.json({ error: 'missing_refresh_token' }, { status: 400 })
  }

  try {
    const { access_token, expires_in } = await refreshAccessToken(refresh_token)
    return Response.json({ access_token, expires_in })
  } catch {
    return Response.json({ error: 'refresh_failed' }, { status: 400 })
  }
}
