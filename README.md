# HireMind — Candidate App

The job seeker's app: AI-ranked recommendations, applications, saved jobs, match
insights and the profile. Served on `candidate.hiremind.co.in`.

Registration lives here (`/register/candidate`), including the résumé-first flow where the
uploaded CV prefills the entire form. The marketing site keeps the "candidate or
recruiter?" chooser that sends people here.

## Routes

| Route | Screen |
|---|---|
| `/login` | Sign-in, role fixed to candidate |
| `/register/candidate` | Résumé-first registration, 3 steps |
| `/otp` | Verification |
| `/dashboard` | AI-ranked job recommendations |
| `/applications` | My applications |
| `/saved-jobs` | Saved jobs |
| `/improve-match` | Match insights |
| `/profile`, `/profile/edit` | The candidate profile |

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # before every deploy
npx tsc --noEmit
```

With no `.env.local`, the API rewrites fall back to `localhost:5001/5002/5003`, so a
native local backend works with nothing to set. To develop against the deployed backend
instead, create `.env.local`:

```
USERS_API_URL=https://api.hiremind.co.in/user-service
CANDIDATE_API_URL=https://api.hiremind.co.in/candidate-service
COMPANY_API_URL=https://api.hiremind.co.in/company-service
```

> **The rewrites are evaluated at build time.** Changing these needs a dev-server restart
> locally, and a rebuild in Docker — they are build args, not runtime env. Never prefix
> them with `NEXT_PUBLIC_`: that exposes them to the browser and bypasses the proxy that
> exists so there is no CORS anywhere.

## How this app was split out

Split from `hiremind_web`, which keeps the marketing website. Each app is **fully
self-contained** — its own copy of the design system (`app/globals.css`), `components/ui`,
`components/shell`, `lib/` and the parts of `modules/auth` it needs. Nothing is shared at
build time, so each repo clones, installs and deploys on its own.

The cost of that choice is duplication: **a fix to a shared component must be applied in
every app that carries it.** The files below exist in more than one repo and will drift
apart silently if only one copy is changed.

| Shared with | Files |
|---|---|
| **recruiter** | **`modules/company/matching/**` — the browser match engine** |
| recruiter | `modules/company/jobs/services/{job,applications}.service.ts`, `modules/company/jobs/shared/**` |
| admin, recruiter, website | `app/globals.css`, `components/ui/**`, `components/shell/**`, `lib/**` |
| recruiter, website | `modules/auth/**` |

> ⚠️ **The match engine is the one to watch.** The candidate's dashboard and the
> recruiter's Candidate Match Analysis run the *same* engine — that is what made the two
> sides finally agree on a score, after a spell where the same application read 40% to the
> candidate and 33% to the recruiter. If these two copies drift, that bug comes back and
> it will not be obvious. `npm run test:matching` runs in both repos; keep them both
> green, and port any engine change to both on the same day.

There is no `proxy.ts` and no `lib/hosts.ts` here. Those existed to decide which app a
hostname should serve; this app *is* one app on one hostname, so the audience is settled
by which repo is deployed, not by a `Host` header. The login route is correspondingly
simple — no role picker, no chooser.
