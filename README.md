# Sovereign Namibia

National digital identity platform for Namibian citizens — directory search, account claim, KYC verification, CMS, and multi-subdomain ecosystem.

## Domains

| Subdomain | Purpose |
|-----------|---------|
| `sovereignnamibia.com` | Public website |
| `kyc.sovereignnamibia.com` | Identity verification |
| `citizen.sovereignnamibia.com` | Citizen secure portal |
| `news.sovereignnamibia.com` | News & notices |
| `services.sovereignnamibia.com` | Government services |
| `admin.sovereignnamibia.com` | Admin portal |
| `api.sovereignnamibia.com` | API gateway |
| `support.sovereignnamibia.com` | Support center |
| `status.sovereignnamibia.com` | System status |

Local dev uses `?subdomain=kyc` query param or path routes (`/kyc`, `/admin`, etc.).

## Quick start

```bash
cd sovereignnamibia
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3010](http://localhost:3010)

### Demo directory search (no database)

- Name: `Johannes Chirongo`
- Mobile: `+264811234441`
- DOB: `1985-03-15`

### Database setup

**Local Homebrew PostgreSQL** (macOS default user is your system username, not `postgres`):

```bash
createdb sovereignnamibia
# .env: DATABASE_URL=postgresql://YOUR_USER@localhost:5432/sovereignnamibia
npm run db:migrate
npm run db:seed
```

Seeded admin: `admin@sovereignnamibia.com` / `admin12345`

## Architecture

- **Next.js 16** App Router with subdomain middleware
- **PostgreSQL** with encrypted sensitive fields (AES-256-GCM)
- **KEYRA theme** tokens — warm institutional Namibia palette
- **Demo mode** when `DATABASE_URL` is unavailable

## Key flows

1. **Directory search** — privacy-safe masked results
2. **Claim account** — mobile OTP → KYC
3. **KYC** — 8-step verification including documents, selfie, telecom
4. **Admin** — CMS, KYC review, audit logs, RBAC roles

## Security

- Encrypted document storage
- Signed upload URLs
- Rate limiting & IP logging
- Audit trails on identity actions
- Role-based admin access (8 roles)
- MFA-ready admin accounts
