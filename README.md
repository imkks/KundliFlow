# KundliFlow (MyAstro)

A full-stack **Vedic Astrology (Jyotish)** platform built with a **Server-Compute-Once + Ultra-Light Thin Client** architecture — ready for Web, PWA, and Android.

- **100% Server-Side Engine (`apps/api`)**: Natal D1–D60 Vargas, Panchang, Avakahada, Shadbala, Ashtakvarga (BAV/SAV), Vimshottari / Yogini / Jaimini Chara Dashas, Chalit, KP, Varshaphal, Arudha Padas, Upagrahas, Bhavas, Aspects, Ghatak, and Yogas/Doshas with Bhanga cancellations. Cached with **`ETag` / `304 Not Modified`**.
- **Ultra-Light Thin Frontend (`apps/web`)**: **~157 kB gzipped JS, 0 WASM files** (verified automatically by GitHub Actions).

---

## Simple Free-Tier Deployment (Pre-Compiled Artifacts, No Domain / No HTTPS Needed)

Every push to `main` automatically builds and uploads **2 ready-to-run artifacts** in **GitHub Actions → CI — Test, Build & Package Artifacts**:
1. **`kundliflow-api-bundle.tar.gz`** — compiled single-file Node.js backend + YAML rules/KB (no `git clone`, no `pnpm`, no compiling on the server).
2. **`kundliflow-web-bundle.tar.gz`** — compiled ultra-light static frontend (`index.html` + `assets/`, 0 WASM).

---

### Step 1 — Run the Compiled API Artifact on Oracle Cloud Always-Free VM (HTTP)

1. In Oracle Cloud (OCI), open ingress port **`8787`** in your VCN Security List (and on the VM: `sudo ufw allow 8787` or `sudo iptables -I INPUT 6 -p tcp --dport 8787 -j ACCEPT`).
2. Install Node.js 20 once on your Ubuntu VM:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs build-essential
   sudo npm install -g pm2
   ```
3. Download **`kundliflow-api-bundle.tar.gz`** from the latest GitHub Actions run, copy it to your VM (`scp`), and run:
   ```bash
   tar -xzf kundliflow-api-bundle.tar.gz
   cd kundliflow-api
   bash start.sh
   ```
   Your API is now live over HTTP at **`http://<YOUR_ORACLE_VM_IP>:8787`**!
   *(Optional: edit `.env` to add `GOOGLE_CLIENT_ID` or `ANTHROPIC_AUTH_TOKEN`, then re-run `bash start.sh`.)*

---

### Step 2 — Deploy the Compiled Frontend Bundle

Set your backend URL in GitHub **Settings → Secrets and variables → Actions → Variables**:
- `VITE_API_URL` = `http://<YOUR_ORACLE_VM_IP>:8787`

Then choose either:
- **Option A — Host the Frontend Artifact on the Same Oracle VM over HTTP** (recommended while using HTTP API, avoids browser HTTPS→HTTP mixed-content blocks):
  ```bash
  # Download kundliflow-web-bundle.tar.gz from GitHub Actions to your VM:
  tar -xzf kundliflow-web-bundle.tar.gz
  npx serve -s kundliflow-web -l 80
  ```
  Open **`http://<YOUR_ORACLE_VM_IP>`** in your browser!
- **Option B — GitHub Pages / Cloudflare Pages / S3**:
  - Enable **Settings → Pages → Source: GitHub Actions** (auto-deploys to `https://imkks.github.io/KundliFlow/`), or upload `kundliflow-web-bundle.tar.gz` to Cloudflare Pages / Vercel / S3.
  - *(Note: HTTPS frontends require an HTTPS API URL — when you're ready for HTTPS later without buying a domain, you can use `bash scripts/deploy-oracle.sh <VM-IP>.nip.io` or Render's free [`render.yaml`](render.yaml).)*

---

## Local Development

```bash
corepack pnpm install
corepack pnpm test                      # 19 test files, 102 tests
corepack pnpm --filter @astro/api build
corepack pnpm --filter @astro/api start # http://localhost:8787
corepack pnpm --filter @astro/web dev   # http://localhost:5173
```

---

## Documentation & Agent Maps

- **For Humans:**
  - [Architecture & Data Flow](docs/ARCHITECTURE.md)
  - [UX & Product Guide (3 Lenses, Kundli, Life Topics, Modals)](docs/UX_PRODUCT_GUIDE.md)
  - [UI Contents & Visual Marker (Screens, Modals, Tokens, Android Parity)](docs/UI_CONTENTS.md)
  - [API, Setup & Development Reference](docs/API_AND_DEVELOPMENT.md)
  - [Decisions Log](docs/DECISIONS.md) · [Test Plan](docs/TEST_PLAN.md) · [Vedic Mathematical Specs](docs/VEDIC_ASTROLOGY_MATHEMATICAL_SPECIFICATIONS.md)
- **For Coding Agents:**
  - [Root Agent Map](AGENTS.md)
  - [Web Frontend Map](apps/web/AGENTS.md)
  - [API Server Map](apps/api/AGENTS.md)
  - [Packages & Engine Pipeline Map](packages/AGENTS.md)

---

## Key REST Endpoints (Web & Android Ready)

| Endpoint | Purpose |
| :--- | :--- |
| `POST /api/auth/google` | Google Sign-In & synced profiles |
| `POST /api/profiles` | Compute static birth bundle once & persist |
| `GET /api/profiles/:id/bundle` | Fetch cached static bundle (`ETag` / `304`) |
| `GET /api/profiles/:id/today` | Hourly scores, Panchang, Horas, Rahu Kalam, transits, month peaks |
| `GET /api/profiles/:id/calendar` | Month heatmap, year overview & date transits |
| `GET /api/profiles/:id/varshaphal` | Tajika Varshaphal, 12 Arudhas & 7 Upagrahas |
| `POST /api/sync` | Bidirectional delta sync for journals & chats |
| `POST /api/ask` | Grounded AI Astrologer Copilot |
