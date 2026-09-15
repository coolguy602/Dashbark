# Supabase setup for Dashbark

Dashbark uses Supabase Auth for optional Google sign-in. Local-only mode still works when Supabase is not configured.

## 1. Add the project variables

Copy `.env.example` to `.env.local` in the repository root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Find both values in **Supabase Dashboard → Project Settings → API**:

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable key** (or legacy `anon` key) → `VITE_SUPABASE_ANON_KEY`

Restart Vite after changing environment variables:

```bash
npm run dev
```

## 2. Enable Google sign-in

In Supabase, open **Authentication → Providers → Google** and enable the provider.

Create a Google OAuth web client in Google Cloud Console. Supabase provides the callback URL to use for the Google OAuth client. Copy the client ID and secret into the Supabase Google provider settings.

## 3. Configure redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**, set the Site URL and add the URLs users may return to:

```text
http://localhost:5173
https://dashbark.ultra.vercel.app
```

For another deployment, add its exact origin as an additional redirect URL. Dashbark passes the current browser origin to Supabase during sign-in.

## 4. Run and verify

Start the app and confirm:

1. The sign-in screen shows **Continue with Google**.
2. Selecting it opens the Google OAuth flow.
3. Returning from Google displays the authenticated account state in the top bar.
4. **Sign out** returns to the sign-in screen.
5. **Continue without an account** still opens local-only mode.

## Security notes

- Keep `.env.local` private. It is ignored by Git.
- The publishable/anon key is safe to use in a browser only when Supabase Row Level Security is configured correctly.
- Never expose or commit a Supabase `service_role` key.
- Google OAuth credentials belong in Supabase/Google Cloud settings, not in the frontend repository.
