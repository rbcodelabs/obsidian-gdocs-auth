export type CallbackApp = 'obsidian' | 'geode'

export function parseCallbackApp(value: string | null | undefined): CallbackApp {
  return value === 'geode' ? 'geode' : 'obsidian'
}

export function buildPluginCallbackUri(app: CallbackApp, params: URLSearchParams): string {
  return `${app}://gdocs-sync?${params.toString()}`
}

export function validatePluginCallbackUri(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    if ((url.protocol === 'obsidian:' || url.protocol === 'geode:') && url.hostname === 'gdocs-sync') {
      return value
    }
  } catch {
    // Invalid URLs are not valid plugin callbacks.
  }
  return null
}
