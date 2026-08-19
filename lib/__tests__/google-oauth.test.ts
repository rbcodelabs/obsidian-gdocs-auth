import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  GoogleOAuthError,
  buildAuthUrl,
  exchangeCode,
  refreshAccessToken,
  GOOGLE_SCOPES,
  decodeOAuthState,
} from '../google-oauth'

// ---------------------------------------------------------------------------
// Env helpers
// ---------------------------------------------------------------------------

function setEnv(overrides: Record<string, string>) {
  vi.stubEnv('GOOGLE_CLIENT_ID', overrides.GOOGLE_CLIENT_ID ?? 'test-client-id')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', overrides.GOOGLE_CLIENT_SECRET ?? 'test-client-secret')
  vi.stubEnv('NEXT_PUBLIC_BASE_URL', overrides.NEXT_PUBLIC_BASE_URL ?? 'https://example.com')
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// GoogleOAuthError
// ---------------------------------------------------------------------------

describe('GoogleOAuthError', () => {
  it('carries the code and sets name', () => {
    const err = new GoogleOAuthError('invalid_grant', 'Token refresh failed')
    expect(err.code).toBe('invalid_grant')
    expect(err.name).toBe('GoogleOAuthError')
    expect(err instanceof Error).toBe(true)
    expect(err instanceof GoogleOAuthError).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// buildAuthUrl
// ---------------------------------------------------------------------------

describe('buildAuthUrl', () => {
  it('builds a valid Google OAuth URL with all required params', () => {
    setEnv({})
    const url = new URL(buildAuthUrl('my-state'))
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(url.searchParams.get('client_id')).toBe('test-client-id')
    expect(url.searchParams.get('redirect_uri')).toBe('https://example.com/api/auth/callback')
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe('my-state')
    expect(url.searchParams.get('callback_app')).toBeNull()
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('prompt')).toBe('consent')
  })

  it('preserves an allowlisted callback app through OAuth state', () => {
    setEnv({})
    const url = new URL(buildAuthUrl('my-state', 'geode'))
    expect(url.searchParams.get('state')).not.toBe('my-state')
    expect(decodeOAuthState(url.searchParams.get('state')!)).toEqual({
      state: 'my-state',
      callbackApp: 'geode',
    })
  })

  it('includes all required Google scopes', () => {
    setEnv({})
    const url = new URL(buildAuthUrl('s'))
    const scope = url.searchParams.get('scope') ?? ''
    for (const s of GOOGLE_SCOPES) {
      expect(scope).toContain(s)
    }
  })

  it('throws when GOOGLE_CLIENT_ID is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://example.com')
    expect(() => buildAuthUrl('s')).toThrow('Missing env var: GOOGLE_CLIENT_ID')
  })
})

// ---------------------------------------------------------------------------
// exchangeCode
// ---------------------------------------------------------------------------

describe('exchangeCode', () => {
  it('returns tokens on success', async () => {
    setEnv({})
    const tokens = {
      access_token: 'access-123',
      refresh_token: 'refresh-456',
      expires_in: 3600,
      token_type: 'Bearer',
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(tokens),
    }))

    const result = await exchangeCode('auth-code')
    expect(result).toEqual(tokens)
  })

  it('throws GoogleOAuthError with code when Google returns JSON error', async () => {
    setEnv({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'invalid_grant', error_description: 'Token expired' }),
    }))

    await expect(exchangeCode('bad-code')).rejects.toThrow(GoogleOAuthError)
    await expect(exchangeCode('bad-code')).rejects.toMatchObject({ code: 'invalid_grant' })
  })

  it('throws GoogleOAuthError with "unknown" code when response is not JSON', async () => {
    setEnv({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('not json')),
      text: () => Promise.resolve('Internal Server Error'),
    }))

    await expect(exchangeCode('code')).rejects.toMatchObject({ code: 'unknown' })
  })

  it('posts to the correct Google token endpoint', async () => {
    setEnv({})
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'a',
        refresh_token: 'r',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await exchangeCode('code')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

// ---------------------------------------------------------------------------
// refreshAccessToken
// ---------------------------------------------------------------------------

describe('refreshAccessToken', () => {
  it('returns access_token and expires_in on success', async () => {
    setEnv({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ access_token: 'new-token', expires_in: 3600 }),
    }))

    const result = await refreshAccessToken('refresh-token')
    expect(result).toEqual({ access_token: 'new-token', expires_in: 3600 })
  })

  it('throws GoogleOAuthError with "invalid_grant" code', async () => {
    setEnv({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({ error: 'invalid_grant', error_description: 'Token has been expired' }),
    }))

    await expect(refreshAccessToken('bad-refresh-token')).rejects.toThrow(GoogleOAuthError)
    await expect(refreshAccessToken('bad-refresh-token')).rejects.toMatchObject({
      code: 'invalid_grant',
    })
  })

  it('falls back to "unknown" code when Google response is not JSON', async () => {
    setEnv({})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.reject(new SyntaxError('not json')),
      text: () => Promise.resolve('Service Unavailable'),
    }))

    await expect(refreshAccessToken('token')).rejects.toMatchObject({ code: 'unknown' })
  })
})
