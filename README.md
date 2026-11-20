# KundliFlow (MyAstro)

A full-stack **Vedic Astrology (Jyotish)** platform built with a **Server-Compute-Once + Ultra-Light Thin Client** architecture — ready for Web, PWA, and Android.

- **100% Server-Side Engine (`apps/api`)**: Natal D1–D60 Vargas, Panchang, Avakahada, Shadbala, Ashtakvarga (BAV/SAV), Vimshottari / Yogini / Jaimini Chara Dashas, Chalit, KP, Varshaphal, Arudha Padas, Upagrahas, Bhavas, Aspects, Ghatak, and Yogas/Doshas with Bhanga cancellations. Cached with **`ETag` / `304 Not Modified`**.
- **Ultra-Light Thin Frontend (`apps/web`)**: **~157 kB gzipped JS, 0 WASM files** (enforced automatically by CI).

---

## Simple 3-Step Free-Tier Deployment (`$0/mo`)

### Step 1 — Deploy the Backend API (Pick Option A or B)

#### Option A: Render.com Free Tier (Easiest — No SSH, 2 mins)
1. Go to [Render Dashboard](https://dashboard.render.com) → **New + → Blueprint**.
2. Connect **`imkks/KundliFlow`** — Render reads [`render.yaml`](render.yaml) automatically.
3. Click **Apply** and copy your live HTTPS URL (e.g. `https://kundliflow-api.onrender.com`).

#### Option B: Oracle Cloud Always-Free ARM VM (Always-On, 0 Cold Starts, 24 GB RAM)
1. Create an Always-Free Ubuntu VM in Oracle Cloud and open ports **80** & **443**.
2. SSH in and run our **1-command deploy script**:
   ```bash
   git clone https://github.com/imkks/KundliFlow.git && cd KundliFlow
   bash scripts/deploy-oracle.sh api.yourdomain.com
   ```
   *(Installs Node 20, pnpm, PM2, builds `@astro/api`, starts it, and sets up free automatic HTTPS via Caddy.)*

---

### Step 2 — Connect Frontend to Backend in GitHub

In **`https://github.com/imkks/KundliFlow`**:
1. **Settings → Pages → Source** → select **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables** → add:
   - `VITE_API_URL` = your backend HTTPS URL from Step 1.

---

### Step 3 — Go Live!

Push to `main` (or click **Actions → Deploy Thin Frontend to GitHub Pages → Run workflow**).
Your app will be live at **`https://imkks.github.io/KundliFlow/`**.

---

## Local Development

```bash
corepack pnpm install
corepack pnpm test                      # 15 test suites, 74 tests
corepack pnpm --filter @astro/api build
corepack pnpm --filter @astro/api start # http://localhost:8787
corepack pnpm --filter @astro/web dev   # http://localhost:5173
```

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
