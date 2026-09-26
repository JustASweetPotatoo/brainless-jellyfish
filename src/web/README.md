# Dashboard Web

## Discord OAuth2 local setup

1. Create an OAuth2 application in the Discord Developer Portal.
2. Add the exact callback URL `http://127.0.0.1:3000/api/auth/discord/callback` to OAuth2 Redirects.
3. Create `.env.local` from `.env.example` and set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` from the application.
4. Keep `DISCORD_REDIRECT_URI` identical to the registered callback URL and set `WEB_ORIGIN` to the web origin.
5. Run `npm run dev` from this directory and open `http://127.0.0.1:3000`.

If Vite uses another port because 3000 is occupied, update both the Discord Developer Portal callback URL and `DISCORD_REDIRECT_URI` to that port. Never expose the client secret through a `VITE_` variable or commit `.env.local`.

The OAuth callback uses authorization code flow with PKCE and state validation. The session is stored in an HttpOnly cookie; the temporary Vite API keeps session data in memory, so active sessions are cleared when the dev server restarts. This Vite middleware is for local development and is not a production authentication server.

## Build

Run `npm run build` from this directory to typecheck and build the web app.
