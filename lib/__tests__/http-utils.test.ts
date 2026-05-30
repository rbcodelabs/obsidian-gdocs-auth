import { describe, it, expect } from 'vitest'
import { corsHeaders, escapeHtml, htmlErrorResponse, ALLOWED_ORIGINS } from '../http-utils'

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('leaves safe strings untouched', () => {
    expect(escapeHtml('Token exchange failed: access_denied')).toBe(
      'Token exchange failed: access_denied',
    )
  })

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('escapes ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
  })

  it('escapes double-quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
  })

  it('escapes single-quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s')
  })

  it('escapes a combined XSS payload', () => {
    const payload = `"><img src=x onerror='alert(1)'>`
    const escaped = escapeHtml(payload)
    // Must not contain any unescaped < > " '
    expect(escaped).not.toMatch(/[<>"']/)
  })
})

// ---------------------------------------------------------------------------
// htmlErrorResponse
// ---------------------------------------------------------------------------

describe('htmlErrorResponse', () => {
  it('returns a 400 response with text/html content-type', () => {
    const res = htmlErrorResponse('Something went wrong')
    expect(res.status).toBe(400)
    expect(res.headers.get('content-type')).toBe('text/html')
  })

  it('embeds the escaped detail in the HTML body', async () => {
    const res = htmlErrorResponse('Token exchange failed: access_denied')
    const body = await res.text()
    expect(body).toContain('Token exchange failed: access_denied')
  })

  it('escapes HTML characters in the detail message', async () => {
    const res = htmlErrorResponse('<script>alert(1)</script>')
    const body = await res.text()
    expect(body).not.toContain('<script>')
    expect(body).toContain('&lt;script&gt;')
  })
})

// ---------------------------------------------------------------------------
// corsHeaders
// ---------------------------------------------------------------------------

describe('corsHeaders', () => {
  it('reflects the desktop Obsidian origin', () => {
    const h = corsHeaders('app://obsidian.md')
    expect(h['Access-Control-Allow-Origin']).toBe('app://obsidian.md')
  })

  it('reflects the iOS Capacitor origin', () => {
    const h = corsHeaders('capacitor://localhost')
    expect(h['Access-Control-Allow-Origin']).toBe('capacitor://localhost')
  })

  it('reflects the Android Capacitor origin', () => {
    const h = corsHeaders('http://localhost')
    expect(h['Access-Control-Allow-Origin']).toBe('http://localhost')
  })

  it('falls back to app://obsidian.md for an unknown origin', () => {
    const h = corsHeaders('https://evil.com')
    expect(h['Access-Control-Allow-Origin']).toBe('app://obsidian.md')
  })

  it('falls back to app://obsidian.md when origin is null', () => {
    const h = corsHeaders(null)
    expect(h['Access-Control-Allow-Origin']).toBe('app://obsidian.md')
  })

  it('always includes Vary: Origin', () => {
    expect(corsHeaders('app://obsidian.md').Vary).toBe('Origin')
    expect(corsHeaders(null).Vary).toBe('Origin')
  })

  it('includes POST and OPTIONS in Allow-Methods', () => {
    const h = corsHeaders('app://obsidian.md')
    expect(h['Access-Control-Allow-Methods']).toContain('POST')
    expect(h['Access-Control-Allow-Methods']).toContain('OPTIONS')
  })
})

// ---------------------------------------------------------------------------
// ALLOWED_ORIGINS
// ---------------------------------------------------------------------------

describe('ALLOWED_ORIGINS', () => {
  it('contains all three Obsidian platform origins', () => {
    expect(ALLOWED_ORIGINS.has('app://obsidian.md')).toBe(true)
    expect(ALLOWED_ORIGINS.has('capacitor://localhost')).toBe(true)
    expect(ALLOWED_ORIGINS.has('http://localhost')).toBe(true)
  })

  it('does not contain arbitrary origins', () => {
    expect(ALLOWED_ORIGINS.has('https://example.com')).toBe(false)
    expect(ALLOWED_ORIGINS.has('https://evil.com')).toBe(false)
  })
})
