# KundliFlow (MyAstro)

A modern, full-stack **Vedic Astrology (Jyotish)** platform built with a **Server-Compute-Once + Ultra-Light Thin Client** architecture — ready for Web, PWA, and future Android apps.

---

## Architecture Highlights

- **100% Server-Side Astrological Engine (`apps/api`)**:
  - All astronomical & Parashara calculations run on the server: Natal Chart (D1–D60 Vargas), Panchang, Avakahada, Shadbala & Bhavabala, Ashtakvarga (BAV/SAV), Vimshottari / Yogini / Jaimini Chara Dashas, Sripati Chalit, KP System, Tajika Varshaphal, Arudha Padas (12), Upagrahas (7), Bhava Analysis (12), Mutual Aspects, Planetary Avasthas, Ghatak Guardrails, and classical Yogas & Doshas (with Bhanga cancellations).
  - Static birth bundles are **computed once**, stored in SQLite, and served with **`ETag` / `304 Not Modified`** so Web and Android clients cache them locally and never recompute or re-download static data.
  - Only lightweight **daily sky** (`/today` — hourly scores, live Panchang, Rahu Kalam, Horas, transits, monthly peak/caution dates) and **delta sync** (`/sync` — journals, check-ins, saved chats) are fetched periodically.
- **Ultra-Light Thin Frontend (`apps/web`)**:
  - **0 WASM files** in `apps/web/dist` (~157 kB gzipped JS total; 425 kB Swiss Ephemeris WASM completely removed from the browser).
  - Interactive North & South Indian SVG charts, 24-hour energy curve, live Gochar cards, Muhurta calendar heatmap, Past Life Event Dasha validator, and grounded AI Astrologer Copilot.

---

## Free-Tier Deployment Guide (`$0/month`)

| Layer | Free-Tier Host | Cost | Role |
| :--- | :--- | :--- | :--- |
| **Frontend (Thin UI)** | **GitHub Pages** (auto-deployed via `.github/workflows/deploy-pages.yml`) or Cloudflare Pages / Vercel | `$0` | Serves the ~157 kB static React SPA |
| **Backend API** | **Oracle Cloud Always-Free ARM Ampere VM** (up to 4 OCPU, 24 GB RAM, 200 GB storage) | `$0` | Runs `apps/api` (Node 20 + PM2 + Caddy HTTPS) |
| **Database** | **SQLite** on Oracle Cloud VM (built-in) — or **MongoDB Atlas M0** (512 MB free) | `$0` | Stores profiles, cached birth bundles, journals, chats |

---

### Step 1: Deploy the Backend API on Oracle Cloud Always-Free VM

1. **Create an Always-Free Ubuntu 22.04/24.04 ARM VM** in Oracle Cloud Infrastructure (OCI):
   - Open ingress ports **80** and **443** in the OCI VCN Security List (and `ufw` if enabled).
2. **SSH into the VM and install Node.js 20, pnpm, PM2, and Caddy**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs git caddy build-essential
   sudo corepack enable
   sudo npm install -g pm2
   ```
3. **Clone, build, and configure `.env`**:
   ```bash
   git clone https://github.com/imkks/KundliFlow.git
   cd KundliFlow
   pnpm install --frozen-lockfile
   pnpm --filter @astro/api build
   cp .env.example .env
   nano .env   # Set PORT=8787, GOOGLE_CLIENT_ID, and optional ANTHROPIC_* keys
   ```
4. **Start the API with PM2 (auto-restart on reboot)**:
   ```bash
   pm2 start apps/api/dist/index.js --name kundliflow-api --cwd /home/ubuntu/KundliFlow
   pm2 save
   pm2 startup
   ```
5. **Enable Free Automatic HTTPS with Caddy** (`/etc/caddy/Caddyfile`):
   ```caddy
   api.yourdomain.com {
       reverse_proxy localhost:8787
   }
   ```
   ```bash
   sudo systemctl reload caddy
   ```
   *(No custom domain? You can use a free subdomain from DuckDNS or nip.io with Caddy!)*

---

### Step 2: Deploy the Thin Frontend on GitHub Pages (Automated)

1. In your GitHub repository (`https://github.com/imkks/KundliFlow`):
   - Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
   - Go to **Settings → Secrets and variables → Actions → Variables** and add:
     - `VITE_API_URL` = `https://api.yourdomain.com` (your Oracle Cloud API URL).
2. Push to `main` (or trigger **Actions → Deploy Thin Frontend to GitHub Pages → Run workflow**).
3. Your ultra-light frontend will be live at `https://imkks.github.io/KundliFlow/`.

---

## Local Development

```bash
# Install dependencies
corepack pnpm install

# Run all 15 test suites (74 tests)
corepack pnpm test

# Build & start the backend API (http://localhost:8787)
corepack pnpm --filter @astro/api build
corepack pnpm --filter @astro/api start

# In a second terminal, start the thin web frontend (http://localhost:5173)
corepack pnpm --filter @astro/web dev
```

---

## Key REST Endpoints (Web & Android Ready)

| Method & Path | Purpose |
| :--- | :--- |
| `POST /api/auth/google` | Verify Google ID token & return user session + synced profiles |
| `POST /api/profiles` | Compute full static birth chart bundle once on server & persist |
| `GET /api/profiles/:id/bundle` | Fetch cached static bundle (supports `ETag` / `304 Not Modified`) |
| `GET /api/profiles/:id/today` | Daily sky: hourly scores, Panchang, Horas, Rahu Kalam, live transits, month peaks |
| `GET /api/profiles/:id/calendar` | Month heatmap, year overview & date-specific transits |
| `GET /api/profiles/:id/varshaphal` | Tajika Varshaphal, 12 Arudha Padas & 7 Upagrahas |
| `POST /api/sync` | Bidirectional delta sync for journal check-ins & saved chats |
| `POST /api/ask` | Grounded AI Astrologer Copilot backed by server-side chart tools |

---

## CI/CD Workflows

- **[`.github/workflows/ci.yml`](.github/workflows/ci.yml)**: Runs `pnpm test`, builds `@astro/api` and `@astro/web`, and **fails the build if any `.wasm` file leaks into `apps/web/dist/assets/`**.
- **[`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)**: Builds and publishes the thin frontend to GitHub Pages on every push to `main`.
