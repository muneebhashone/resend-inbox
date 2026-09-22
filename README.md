# Resend Inbox

A minimal personal inbox for [Resend](https://resend.com) that lets you receive, read, thread, and reply to emails on your custom domain — with a configurable HTML signature.

Built with Next.js 16, Turso (libSQL), and the Resend SDK.

## Features

- Receive inbound emails via Resend webhooks
- Suppress unauthenticated messages that spoof your own sending domain
- Sync/backfill emails from the Resend Receiving API
- Threaded conversation view
- Reply, reply-all, and compose new emails
- AI-assisted reply drafting (DeepSeek via Vercel AI SDK)
- Configurable HTML signature appended to every outbound message
- Proper email threading via `In-Reply-To` and `References` headers
- Password-protected single-user access
- Attachment download links for received emails

## Prerequisites

- A [Resend](https://resend.com) account with a verified domain
- Inbound (receiving) enabled on your domain — see [Receiving emails](https://resend.com/docs/dashboard/receiving/introduction)
- A [Turso](https://turso.tech) database (free tier works)

## Setup

### 1. Clone and install

```bash
npm install
cp .env.example .env.local
```

### 2. Configure environment variables

```env
RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=...
INBOX_PASSWORD=your-secret-password
SESSION_SECRET=random-32-char-string-at-least
DEEPSEEK_API_KEY=sk-...
INBOX_PROTECTED_DOMAINS=yourdomain.com
CAL_WEBHOOK_SECRET=your-cal-webhook-secret
CAL_EVENT_TYPE_ID=your-30min-event-type-id
```

For local development without Turso, you can use:

```env
TURSO_DATABASE_URL=file:local.db
```

### 3. Push the database schema

```bash
npm run db:push
```

### 4. Configure Resend

1. **Receiving** — Ensure MX records are set for your domain (or a subdomain like `mail.yourdomain.com`).
2. **Webhook** — In the Resend dashboard, add a webhook:
   - URL: `https://your-app.vercel.app/api/webhooks/resend`
   - Event: `email.received`
   - Copy the signing secret to `RESEND_WEBHOOK_SECRET`
3. **Sending** — Use a verified `from` address on the same domain in Settings after first login.

`INBOX_PROTECTED_DOMAINS` is a comma-separated list. Inbound messages claiming to
come from one of these domains are suppressed unless Amazon SES reports an aligned
DMARC pass. It defaults to `themuneebh.com` for this deployment.

### 5. Run locally

```bash
npm run dev
```

For local webhook testing, expose your dev server with [ngrok](https://ngrok.com) or the [Resend CLI](https://resend.com/docs/cli):

```bash
ngrok http 3000
# Use the ngrok URL as your webhook endpoint
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy
5. Update the Resend webhook URL to your production domain

## Usage

1. Open the app and sign in with `INBOX_PASSWORD`
2. Go to **Settings** and set your from name, from email, and HTML signature
3. Click **Sync from Resend** to import existing received emails
4. Select a thread to read and reply — your signature is appended automatically
5. Use **Draft reply** or **Draft message** when composing to generate an editable AI draft (requires `DEEPSEEK_API_KEY`)

### Local Codex inbox access

The `resend-inbox` Codex skill uses `npm run inbox -- <command>` from this repository. Supply the live Turso credentials in the process environment. Sending and syncing also require `RESEND_API_KEY`; AI drafting requires `DEEPSEEK_API_KEY`. The command refuses to send without `--confirm`.

```bash
npm run inbox -- search 'from:client@example.com'
npm run inbox -- thread <email-id>
npm run inbox -- booking-status <cal-booking-uid>
npm run inbox -- draft --reply <email-id> --instructions 'Focus on the architecture question'
npm run inbox -- send --reply <email-id> --body-file /path/to/body.txt --confirm
```

### Personalised Cal.com booking welcome

After deploying this version and pushing the database schema, set `CAL_WEBHOOK_SECRET` and `CAL_EVENT_TYPE_ID` in the inbox app's production environment. Find the numeric event type ID for `https://cal.com/themuneebh/30min` in Cal.com. In Cal.com Settings → Developer → Webhooks, create a subscription for that event type with the `Booking Created` trigger, URL `https://<your-inbox-host>/api/webhooks/cal`, the same secret, and the default payload (no custom template). Cal.com requires a public HTTPS subscriber URL.

Only accepted bookings for that event type receive a welcome. The webhook checks Cal.com's signature before processing. The email uses booking answers to write a short personal acknowledgement; it falls back to a standard welcome when answers or AI generation are unavailable. Cal.com continues to send its own calendar confirmation. The inbox Settings must have a verified official-domain sender, such as `hello@themuneebh.com`. Repeated webhook deliveries are tracked in Turso and sent with a stable Resend idempotency key. An ambiguous send older than the idempotency window is recorded as `uncertain` for manual reconciliation.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Push schema to Turso |
| `npm run db:studio` | Open Drizzle Studio |

## Architecture

```
Resend webhook → /api/webhooks/resend → fetch full email → Turso DB
Inbox UI → /api/emails/send → Resend Send API (with signature + thread headers)
```

## License

MIT
