export interface GoogleTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/tasks',
]

function getRequiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

// Thrown when Google returns an error response. Carries the machine-readable
// error code (e.g. "invalid_grant") so callers can branch on it.
export class GoogleOAuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'GoogleOAuthError'
  }
}

export function buildAuthUrl(state: string): string {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID')
  const baseUrl = getRequiredEnv('NEXT_PUBLIC_BASE_URL')
  const redirectUri = `${baseUrl}/api/auth/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES.join(' '),
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET')
  const baseUrl = getRequiredEnv('NEXT_PUBLIC_BASE_URL')
  const redirectUri = `${baseUrl}/api/auth/callback`

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    // Mirror the same error-parsing logic as refreshAccessToken so callers
    // always get a GoogleOAuthError with a machine-readable code.
    let errorCode = 'unknown'
    let description = `HTTP ${response.status}`
    try {
      const errBody = (await response.json()) as { error?: string; error_description?: string }
      if (errBody.error) errorCode = errBody.error
      if (errBody.error_description) description = errBody.error_description
    } catch {
      description = await response.text().catch(() => `HTTP ${response.status}`)
    }
    throw new GoogleOAuthError(errorCode, `Token exchange failed [${errorCode}]: ${description}`)
  }

  return response.json() as Promise<GoogleTokens>
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = getRequiredEnv('GOOGLE_CLIENT_ID')
  const clientSecret = getRequiredEnv('GOOGLE_CLIENT_SECRET')

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    // Google always returns JSON on token errors; parse it to get the
    // machine-readable code (e.g. "invalid_grant") rather than a raw blob.
    let code = 'unknown'
    let description = `HTTP ${response.status}`
    try {
      const errBody = (await response.json()) as { error?: string; error_description?: string }
      if (errBody.error) code = errBody.error
      if (errBody.error_description) description = errBody.error_description
    } catch {
      description = await response.text().catch(() => `HTTP ${response.status}`)
    }
    throw new GoogleOAuthError(code, `Token refresh failed [${code}]: ${description}`)
  }

  const data = (await response.json()) as {
    access_token: string
    expires_in: number
  }
  return { access_token: data.access_token, expires_in: data.expires_in }
}
