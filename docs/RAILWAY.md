# Deploy Sovereign Namibia on Railway

Project: **sovereign-namibia** (Ankit Mekwan's Projects)  
Dashboard: https://railway.com/project/cdfb4415-affa-454a-bd39-acc04d924425

## Connect GitHub repo

1. Open the **sovereign-namibia** service in Railway
2. **Settings** → **Source** → **Connect Repo**
3. Select `Ciright-Inc/sovereign-namibia` and branch `main`

> CLI repo connect requires Railway ↔ GitHub authorization. Use the dashboard if `railway add --repo` returns Unauthorized.

## Services

| Service | Purpose |
|---------|---------|
| `sovereign-namibia` | Next.js app (Dockerfile) |
| `Postgres` | PostgreSQL database |

## Environment variables

See `railway.env.example`. Required on the app service:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ENCRYPTION_KEY` | 64-char hex (AES-256) |
| `SESSION_SECRET` | Long random string |
| `JWT_SECRET` | Long random string |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `sovereignnamibia.com` |
| `NEXT_PUBLIC_APP_URL` | Your Railway public URL |

Set `NEXT_PUBLIC_*` before build; redeploy after changing them.

## Deploy

**From GitHub:** push to `main` (after repo is connected).

**From CLI:**

```bash
cd sovereignnamibia
railway link -p cdfb4415-affa-454a-bd39-acc04d924425 -s sovereign-namibia
railway up
```

## Verify

```bash
curl https://YOUR-DOMAIN.up.railway.app/api/health
```

Generate a public domain: service **Settings** → **Networking** → **Generate Domain**.

## Admin login (after seed)

- Email: `admin@sovereignnamibia.com`
- Password: `admin12345` (change in production)
