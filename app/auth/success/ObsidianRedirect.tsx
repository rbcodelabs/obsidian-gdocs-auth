'use client'

import { useEffect } from 'react'

export default function ObsidianRedirect({ obsidianUri }: { obsidianUri: string }) {
  useEffect(() => {
    // Fire the obsidian:// URI to hand off the tokens to the plugin.
    // Using window.location.href (not a server redirect) keeps the tab open so
    // the success page stays visible — browsers don't navigate away on custom URIs.
    window.location.href = obsidianUri
  }, [obsidianUri])

  return null
}
