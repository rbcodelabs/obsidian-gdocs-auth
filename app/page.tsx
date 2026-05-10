export default function HomePage() {
  return (
    <>
      <style>{`
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

        .note strong {
          color: #999;
          font-weight: 500;
        }
      `}</style>

      <div className="card">
        <div className="icon">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect width="40" height="40" rx="10" fill="#7C3AED" fillOpacity="0.15" />
            <path
              d="M20 10C14.477 10 10 14.477 10 20s4.477 10 10 10 10-4.477 10-10S25.523 10 20 10zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 4v5.414l3.293 3.293 1.414-1.414L21 20.586V16h-2z"
              fill="#7C3AED"
            />
          </svg>
        </div>

        <h1>Obsidian GDocs Sync</h1>
        <p className="subtitle">OAuth proxy for the Obsidian Google Docs Sync plugin</p>

        <div className="divider" />

        <p className="note">
          <strong>Redirected here by mistake?</strong><br />
          This page is only used during the Google OAuth authorization flow.
          You can safely close this tab.
        </p>
      </div>
    </>
  )
}
