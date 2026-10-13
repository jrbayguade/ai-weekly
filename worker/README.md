# ai-weekly-subs

A tiny Cloudflare Worker that handles double opt-in for the AI Weekly email
newsletter. No dependencies, plain ES modules.

- `POST /subscriu` checks the Origin and a Turnstile token, then emails a
  signed confirmation link (HMAC-SHA256, stateless, valid 48 hours) via Resend.
- `GET /confirma?t=...` verifies the link, adds the contact to the language
  segment in Resend, and redirects to the confirmation page on the site.

The code is public; the secrets are not. They live only in Cloudflare:

    npx wrangler secret put RESEND_KEY
    npx wrangler secret put SIGNATURA
    npx wrangler secret put TURNSTILE_SECRET

Public settings (origin, sender, Resend segment ids) are in `wrangler.toml`.
Deploy with `npx wrangler deploy` from this directory.
