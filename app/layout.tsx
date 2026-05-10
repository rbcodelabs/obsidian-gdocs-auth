import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Obsidian GDocs Sync',
  description: 'OAuth proxy for the Obsidian Google Docs Sync plugin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
