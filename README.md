# ⚡ Website Uptime & Performance Monitor

> A high-precision, serverless website status dashboard built with React, TypeScript, and Tailwind CSS — designed for zero-cost execution with **GitHub Actions** and hosting on **GitHub Pages**.

![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)
![GitHub Actions Workflow](https://img.shields.io/badge/GitHub%20Actions-Ready-blue.svg)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Supported-emerald.svg)

---

## 🌟 Overview & Capabilities

- **Automated Uptime & Latency Monitoring**: Scheduled cron jobs execute HTTP health probes every 5 minutes.
- **High-Precision Dashboard**: High-density grid and tabular views, live filtering by category or query, and latency trend charts.
- **Incident & Health Logging**: Stores historical 24h, 7d, and 30d SLAs and records logs into `public/data/status.json`.
- **JSON Configuration**: Update monitored targets easily via `data/urls.json` or the built-in UI Config Editor.
- **100% Free Hosting**: Runs entirely serverless using GitHub Actions cron schedules and GitHub Pages static hosting.

---

## 🚀 How to Enable & Configure on GitHub

Follow these steps to deploy your website status monitor to GitHub Pages with automated cron checks.

### Step 1: Push Code to GitHub

Initialize your Git repository (if not already done) and push to GitHub:

```bash
git init
git add .
git commit -m "feat: initial website status monitor setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

### Step 2: Configure Workflow Permissions

GitHub Actions requires write permissions to commit updated health metrics back to `public/data/status.json` and deploy to GitHub Pages.

1. Open your repository on GitHub (`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`).
2. Go to **Settings** &rarr; **Actions** &rarr; **General**.
3. Under **Workflow permissions**, select **Read and write permissions**.
4. Check **"Allow GitHub Actions to create and approve pull requests"**.
5. Click **Save**.

---

### Step 3: Enable GitHub Pages Deployment

1. On GitHub, navigate to **Settings** &rarr; **Pages**.
2. Under **Build and deployment** &rarr; **Source**, select **GitHub Actions**.
   > *Note: Selecting "GitHub Actions" switches Pages deployment to the official native workflow runner.*

---

### Step 4: Verify the GitHub Actions Workflow (`.github/workflows/monitor.yml`)

The repository includes a ready-to-use workflow at `.github/workflows/monitor.yml`:

```yaml
name: Website Status Monitor & GitHub Pages Deploy

on:
  schedule:
    # Run every 5 minutes (GitHub Actions cron schedule)
    - cron: '*/5 * * * *'
  workflow_dispatch: # Allows manual trigger from GitHub Actions UI
  push:
    branches:
      - main

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  monitor-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install Dependencies
        run: npm ci || npm install

      - name: Execute Health Checks
        run: node scripts/monitor.js

      - name: Commit Updated Status Log
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data/status.json
          git diff --staged --quiet || git commit -m "chore(status): update website status logs [skip ci]"
          git push origin main || true

      - name: Build Static Dashboard
        run: npm run build

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v4

      - name: Upload Artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

### Step 5: Configure Monitored Websites (`data/urls.json`)

To add, remove, or modify monitored endpoints, edit `data/urls.json`:

```json
[
  {
    "id": "site-google",
    "name": "Google Main Search",
    "url": "https://www.google.com",
    "method": "GET",
    "expectedStatus": 200,
    "timeout": 5000,
    "category": "Search & Web Services",
    "enabled": true
  },
  {
    "id": "site-github",
    "name": "GitHub API Health",
    "url": "https://api.github.com",
    "method": "GET",
    "expectedStatus": 200,
    "timeout": 5000,
    "category": "Developer APIs",
    "enabled": true
  }
]
```

#### Field Schema:
| Field | Type | Description |
|---|---|---|
| `id` | String | Unique slug identifier (e.g. `"site-google"`) |
| `name` | String | Display name shown on the dashboard card |
| `url` | String | HTTP/HTTPS target endpoint URL |
| `method` | String | HTTP Method (`"GET"`, `"HEAD"`, `"POST"`) |
| `expectedStatus` | Number | Expected HTTP status code (default: `200`) |
| `timeout` | Number | Max request timeout in milliseconds (default: `5000`) |
| `category` | String | Category tag for dashboard filtering |
| `enabled` | Boolean | `true` to actively check, `false` to pause |

---

### Step 6: Manual Triggering

You can run an instant status check and force a deploy without waiting for the 5-minute cron:

1. Open your repository on GitHub.
2. Click the **Actions** tab.
3. In the left sidebar, click **Website Status Monitor & GitHub Pages Deploy**.
4. Click **Run workflow** &rarr; Select `main` branch &rarr; Click **Run workflow**.

---

## 🛠️ Local Development & Testing

```bash
# 1. Clone your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# 2. Install project dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Manually trigger the check runner script
node scripts/monitor.js

# 5. Build for production preview
npm run build
```

The app will run locally on `http://localhost:3000`.

---

## 🏗️ Project Architecture

```
.
├── .github/
│   └── workflows/
│       └── monitor.yml        # GitHub Actions Cron & Pages deployment pipeline
├── data/
│   └── urls.json              # Monitored URLs configuration file
├── public/
│   └── data/
│       └── status.json        # Output status history & SLA metrics
├── scripts/
│   └── monitor.js             # Node.js check execution engine
├── src/
│   ├── components/            # React UI components (Navbar, ServiceCards, Charts, Config)
│   ├── types.ts               # Shared TypeScript definitions
│   └── App.tsx                # Main dashboard entry point
├── server.ts                  # Development API proxy server
└── package.json
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
