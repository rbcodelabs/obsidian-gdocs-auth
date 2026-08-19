import { describe, expect, it } from 'vitest'
import { buildPluginCallbackUri, parseCallbackApp, validatePluginCallbackUri } from '../callback-app'

describe('callback app allowlist', () => {
  it('selects Geode only for the literal geode app value', () => {
    expect(parseCallbackApp('geode')).toBe('geode')
    expect(buildPluginCallbackUri('geode', new URLSearchParams({ state: 's' }))).toBe(
      'geode://gdocs-sync?state=s',
    )
  })

  it('defaults unknown and missing values to Obsidian', () => {
    expect(parseCallbackApp(null)).toBe('obsidian')
    expect(parseCallbackApp('https://evil.example')).toBe('obsidian')
    expect(buildPluginCallbackUri('obsidian', new URLSearchParams({ state: 's' }))).toBe(
      'obsidian://gdocs-sync?state=s',
    )
  })

  it('rejects arbitrary success-page redirect targets', () => {
    expect(validatePluginCallbackUri('https://evil.example/steal')).toBeNull()
    expect(validatePluginCallbackUri('geode://other-action?state=s')).toBeNull()
    expect(validatePluginCallbackUri('geode://gdocs-sync?state=s')).toBe(
      'geode://gdocs-sync?state=s',
    )
  })
})
