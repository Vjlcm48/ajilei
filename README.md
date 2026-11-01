# AJILEI

**A free online version of AJILEI, a traditional Venezuelan card game. Play in the browser, no download required.**

🎮 **Live:** [ajilei.io](https://ajilei.io) · Status: public beta (v0.9)

AJILEI is a full-stack web application built and maintained by a single developer: front end, database, server-side logic, automated tests and production deployment.

---

## Features

- **Play against AI opponents** with multiple difficulty levels. Each level uses its own strategy, and higher levels can bluff to mislead the player.
- **User accounts** with email sign-in.
- **Persistent player balance** and stored match records, kept in a server-side coin ledger.
- **Rewarded coins**: players earn in-game coins by playing or by watching a simulated rewarded video (40 seconds), and every reward is recorded in the ledger.
- **In-game store (early stage)**: players can buy table mats with coins earned in the game. Coins are earned, not sold.
- **Multiplayer rooms** *(in development)*: a host creates a room and other players join the table.
- **Account deletion** handled securely on the server.
- **Installable web app (PWA)** for desktop and mobile, with game sound effects.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Front end | React 19, Vite, JavaScript |
| Backend | Supabase (PostgreSQL, Authentication, Edge Functions) |
| Database | SQL migrations, Row Level Security, role-based permissions, triggers |
| Testing | Vitest, PGlite (in-memory PostgreSQL), SQL verification scripts |
| Hosting | Cloudflare |
| Audio | Howler.js |
| Tooling | ESLint, Git, GitHub, Supabase CLI |

## How the AI Opponents Work

The opponents are **rule-based AI**, not a language model. Each difficulty level combines:

- Card evaluation rules that decide what to play in each situation
- A distinct playing strategy per level
- Controlled bluffing at higher levels, so the opponent's behavior is less predictable

The goal was opponents that feel like they are "thinking", with a clear difference between levels.

## Security and Data Integrity

- **Server-side rules for money-like data**: balances and purchases go through database functions, never through direct writes from the browser.
- **Protected ledgers**: database triggers block manual deletion of financial records.
- **Least privilege**: client functions are granted only to authenticated users; sensitive functions run only with the backend role.
- **Verified identity**: account deletion runs in an Edge Function that takes the user ID from the verified session token, never from the request body.
- **Anti-abuse**: the welcome bonus cannot be claimed twice by re-registering with the same email or an alias of it.
- **No secrets in the repository**: configuration lives in local environment files (see `.env.example`).

## Testing

- **Unit tests** with Vitest for the client logic and game rules.
- **Simulated database**: PGlite runs PostgreSQL in memory, so database logic is tested without touching production.
- **SQL verification scripts** check the system rules (for example, that deleting an account leaves no orphaned data).
- **Pre-deploy checks**: verification scripts run before every database migration is pushed.
- System rules are documented as numbered invariants, each linked to the code that enforces it and the test that verifies it.

## Running Locally

```bash
npm install
# Copy .env.example to .env.local and fill in your own Supabase project values
npm run dev       # start the development server
npm test          # run the test suite
npm run lint      # check code style
npm run build     # production build
```

## Development Approach

AJILEI is developed with an **AI-assisted workflow**, using Claude Code as a pair programmer for architecture, implementation, debugging and code review. The developer defines the requirements, makes the technical decisions and verifies every change with tests.

Code comments and internal documentation are written in Spanish.

## Author

**Victor La Cruz** · Joliet, IL


Also the creator of [SumaMente](https://play.google.com/store/apps/details?id=com.heptacreation.sumamente), a mental math training app published on Google Play.
