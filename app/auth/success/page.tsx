import ObsidianRedirect from './ObsidianRedirect'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ obsidian_uri?: string }>
}) {
  const params = await searchParams
  const obsidianUri = params.obsidian_uri

  const styles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #0f0f0f;
      color: #e8e8e8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card {
      max-width: 480px;
      width: 100%;
      padding: 48px 40px;
      background: #1a1a1a;
      border: 1px solid #2e2e2e;
      border-radius: 12px;
      text-align: center;
    }

    .icon {
      font-size: 40px;
      line-height: 1;
      margin-bottom: 20px;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 15px;
      color: #888;
      margin-bottom: 28px;
      line-height: 1.5;
    }

    .divider {
      height: 1px;
      background: #2e2e2e;
      margin-bottom: 24px;
    }

    .note {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }

    .note a {
      color: #7C3AED;
      text-decoration: underline;
      cursor: pointer;
    }

    .note a:hover {
      color: #9f67ff;
    }

    .check {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      background: rgba(34, 197, 94, 0.12);
      border-radius: 50%;
      margin-bottom: 20px;
    }
  `

  if (!obsidianUri) {
    return (
      <>
        <style>{styles}</style>
        <div className="card">
          <div className="icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <rect width="40" height="40" rx="10" fill="#ef4444" fillOpacity="0.15" />
              <path d="M20 12v10M20 26v2" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1>Something went wrong</h1>
          <p className="subtitle">The authorization response was missing required data.</p>
          <div className="divider" />
          <p className="note">You can close this tab and try connecting again from Obsidian.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{styles}</style>
      <ObsidianRedirect obsidianUri={obsidianUri} />
      <div className="card">
        <div className="check">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path
              d="M7 14.5l5 5 9-10"
              stroke="#22c55e"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1>Connected to Google</h1>
        <p className="subtitle">
          Obsidian has been authorized. You can close this tab.
        </p>
        <div className="divider" />
        <p className="note">
          Obsidian didn&apos;t open automatically?{' '}
          <a href={obsidianUri}>Click here to finish connecting.</a>
        </p>
      </div>
    </>
  )
}
