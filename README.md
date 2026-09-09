# Obsidian Google Docs Auth Proxy

A tiny Next.js 15 app deployed on Vercel that handles the Google OAuth 2.0 flow for the [`obsidian-gdocs-sync`](https://github.com/rbcodelabs/obsidian-gdocs-sync) plugin.

**Why a proxy?** The Google OAuth web application flow requires a `client_secret` to exchange an auth code for tokens. Browser-based apps (including Obsidian plugins) can't safely hold a client secret. This proxy keeps the secret server-side while returning tokens directly to the plugin via a custom URI scheme redirect.

**Production URL:** `https://obsidian-gdocs-auth.vercel.app`

---

## How it works

```
Plugin → /api/auth/start?state=<uuid>[&callback_app=geode]
  → Redirects to Google consent screen

Google → /api/auth/callback?code=…&state=…
  → Proxy exchanges code for tokens (client_secret stays server-side)
  → Redirects to obsidian://gdocs-sync by default, or geode://gdocs-sync for Geode

Plugin → POST /api/auth/refresh  { refresh_token: "…" }
  → Returns { access_token, expires_in }
```

No server-side token storage — tokens are passed directly to the plugin in the redirect URI and stored in Obsidian's plugin data.

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/start` | GET | Validates `state`, allowlists optional `callback_app`, redirects to Google OAuth consent screen |
| `/api/auth/callback` | GET | Receives auth code, exchanges for tokens, redirects to `obsidian://` URI |
| `/api/auth/refresh` | POST | Accepts `{ refresh_token }`, returns `{ access_token, expires_in }` |

---

## Local Development

### Prerequisites

- Node 18+
- A Google Cloud project with OAuth 2.0 credentials (type: **Web application**)
- Redirect URI `http://localhost:3010/api/auth/callback` added to your OAuth client

### Setup

```bash
git clone https://github.com/rbcodelabs/obsidian-gdocs-auth
cd obsidian-gdocs-auth
npm install
```

Create `.env.local`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3010
```

Start the dev server:

```bash
npm run dev -- --port 3010
# or if using nextdev:
nextdev start --port 3010
```

The proxy is now available at `http://localhost:3010`. Point the plugin's **Auth Proxy URL** setting to this address while developing.

---

## Deployment (Vercel)

```bash
# Initial deploy
npx vercel

# Set environment variables (use printf to avoid trailing newlines)
printf '%s' 'your-client-id' | npx vercel env add GOOGLE_CLIENT_ID production
printf '%s' 'your-secret'    | npx vercel env add GOOGLE_CLIENT_SECRET production
printf '%s' 'https://obsidian-gdocs-auth.vercel.app' | npx vercel env add NEXT_PUBLIC_BASE_URL production

# Deploy to production
npx vercel --prod
```

After deploying, add `https://<your-domain>/api/auth/callback` as an authorized redirect URI in your Google Cloud OAuth client.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret (never exposed to the client) |
| `NEXT_PUBLIC_BASE_URL` | Base URL of this proxy (`https://obsidian-gdocs-auth.vercel.app` in prod, `http://localhost:3010` in dev) |

---

## Google Cloud Setup

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an OAuth 2.0 Client ID (type: **Web application**)
3. Add authorized redirect URIs:
   - `https://obsidian-gdocs-auth.vercel.app/api/auth/callback`
   - `http://localhost:3010/api/auth/callback`
4. Enable: **Google Docs API**, **Google Drive API**, **Google Sheets API**, **Google Slides API**, and **Tasks API** for Tasks sync.
5. OAuth consent screen scopes (each prefixed with `https://www.googleapis.com/auth/`): `documents.readonly`, `documents`, `drive.readonly`, `drive.file`, `spreadsheets.readonly`, `spreadsheets`, `presentations.readonly`, `presentations`, `tasks`.
6. Status: **External / Testing** until verified by Google (add test users manually)

### Google Workspace MCP connections

The proxy requests the read and write scopes listed in Google's [Workspace MCP setup guide](https://developers.google.com/workspace/guides/configure-mcp-servers) for Docs, Drive, Sheets, and Slides. Every new connection requests this expanded set, including permission to read and edit spreadsheets and presentations. The existing Tasks scope remains included.

In the Google Cloud project that owns your OAuth client, enable the corresponding **Docs MCP API**, **Drive MCP API**, **Sheets MCP API**, and **Slides MCP API** in addition to the standard APIs above. Google's MCP services currently require [Workspace Developer Preview Program](https://developers.google.com/workspace/preview) access; enabling an API or hosting this proxy on a corporate domain does not itself enroll the project.

After deploying a proxy with these scopes, disconnect and reconnect Google Docs Sync to approve the expanded consent request. Refreshing an existing token does not grant the newly requested scopes. If switching to another proxy or corporate OAuth client, disconnect before changing **Auth Proxy URL**, then reconnect using the intended Workspace account. The existing Obsidian/Geode callback selection and token refresh flow are unchanged.

Live MCP access must still be validated with the enrolled project's account after reconnecting; local scope tests only verify the authorization request.

---

## Project Structure

```
app/api/auth/
  start/route.ts      GET  — build Google auth URL, redirect
  callback/route.ts   GET  — exchange code for tokens, redirect to obsidian://
  refresh/route.ts    POST — refresh access token
lib/
  google-oauth.ts     buildAuthUrl(), exchangeCode(), refreshAccessToken()
```

---

## License

MIT
