# PhishGuard AI – Production Deployment Guide

This guide provides end-to-end instructions for deploying **PhishGuard AI** across production environments:
- **Method 1**: **100% Free Cloud Deployment** (MongoDB Atlas + Render + Vercel) — *Recommended for Final-Year Project presentation & live evaluation.*
- **Method 2**: **One-Click Docker Compose Deployment** (Self-hosted on AWS / DigitalOcean / Local VPS).
- **Chrome Extension Distribution**: Packaging and connecting the browser extension to your deployed backend.

---

## Architecture Overview

```
                        +------------------------------+
                        |      Chrome Extension        |
                        | (Manifest V3 - Popup/Alerts) |
                        +--------------+---------------+
                                       |
                   HTTPS API Calls     |
                                       v
+------------------------+      +------------------------+      +------------------------+
|    React Frontend      | ---> |   Node/Express API     | ---> |    MongoDB Atlas       |
| (Vercel / Port 5173)   |      |  (Render / Port 8000)  |      |   (Cloud Database)     |
+------------------------+      +-----------+------------+      +------------------------+
                                            |
                                            v
                                 +----------------------+
                                 |  ML Detection Engine |
                                 | 4 Pre-Trained Models |
                                 | (Gradient Boost, RF) |
                                 +----------------------+
```

---

## Method 1: 100% Free Cloud Deployment (Recommended)

### Step 1: Deploy Cloud Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up / log in.
2. Click **Create a Cluster** and choose the **M0 Free (Shared)** tier.
3. In **Security Quickstart**:
   - Create a database user (e.g., `phishguard_admin` with a strong password).
   - Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** -> Confirm.
4. Go to **Clusters** -> Click **Connect** -> Choose **Drivers (Node.js)**.
5. Copy your connection URI string. It will look like:
   ```text
   mongodb+srv://phishguard_admin:<password>@cluster0.abcde.mongodb.net/phishguard_ai?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your real user password).*

---

### Step 2: Deploy Backend API (Render)
1. Push your project to a GitHub repository (if not already done).
2. Go to [Render.com](https://render.com) and log in.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. Configure the service:
   - **Name**: `phishguard-backend`
   - **Root Directory**: `phishguard-ai/backend` *(or `backend` if repo root is the project folder)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
6. Add the following **Environment Variables**:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `8000` | Port for Express |
   | `MONGODB_URI` | *Your MongoDB Atlas URI from Step 1* | Cloud Database connection |
   | `JWT_SECRET` | *Any long random string (e.g. `phishguard_jwt_super_key_2026`)* | Token signing |
   | `JWT_EXPIRES_IN` | `7d` | Token validity |
   | `CORS_ORIGIN` | `*` | Allows cross-origin calls from frontend & extension |
   | `ADMIN_EMAIL` | `admin@phishguard.ai` | Default system administrator email |
   | `ADMIN_PASSWORD` | `Admin@PhishGuard2026!` | Initial administrator password |

7. Click **Create Web Service**.
8. Once deployed, Render will provide a live URL, e.g.:
   `https://phishguard-backend.onrender.com`
   Verify it by navigating to:
   `https://phishguard-backend.onrender.com/api/health`
   *(Should return `{ status: "healthy", database: "connected", active_model: "Gradient Boosted Trees" }`)*.

---

### Step 3: Deploy Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository.
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and select `phishguard-ai/frontend` *(or `frontend`)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://phishguard-backend.onrender.com/api` *(Your Render backend URL from Step 2)* |
6. Click **Deploy**.
7. In ~60 seconds, your frontend will be live at:
   `https://phishguard-ai.vercel.app` (or similar).

---

### Step 4: Configure the Chrome Extension for Production
1. Open Google Chrome and click the **PhishGuard AI** extension icon in your toolbar.
2. Click the gear icon (**⚙️**) in the top right of the popup.
3. In **Deployment Settings**:
   - **Backend API Endpoint**: Paste your Render backend URL with `/api`:
     `https://phishguard-backend.onrender.com/api`
   - **Frontend Dashboard URL**: Paste your Vercel URL with `/dashboard`:
     `https://phishguard-ai.vercel.app/dashboard`
4. Click **Save & Reconnect**.
5. The status indicator will turn green: **Engine Online**.
6. The extension is now actively protecting browsing using your live cloud ML engine!

---

## Method 2: One-Click Docker Compose Deployment

If you want to run everything on a VPS (AWS EC2, DigitalOcean Droplet, Linode) or local production:

1. Clone your repository on the target server:
   ```bash
   git clone <your-repo-url>
   cd phishguard-ai
   ```
2. Review `.env` or adjust credentials in `docker-compose.yml`.
3. Launch all services:
   ```bash
   docker-compose up --build -d
   ```
4. Services will launch automatically:
   - **Frontend & Nginx**: `http://<server-ip>:5173`
   - **Backend API**: `http://<server-ip>:8000`
   - **MongoDB Database**: `mongodb://localhost:27017`
5. To stop the containers:
   ```bash
   docker-compose down
   ```

---

## Distributing the Chrome Extension

A pre-packaged ZIP archive is already created for distribution:
- **Location**: `phishguard-ai/phishguard-chrome-extension.zip`

### To install on another machine:
1. Extract `phishguard-chrome-extension.zip` into a folder.
2. Open Chrome/Edge and navigate to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.
5. In the extension popup, click ⚙️ and point the backend to your live cloud URL.

---

## Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: `https://<backend-url>/api/health` returns `healthy` and `active_model: "Gradient Boosted Trees"`.
- [ ] **Landing Page**: Web application loads smoothly on Vercel with dark cybersecurity theme.
- [ ] **Quick Scan**: Scanning `https://github.com` from the landing page yields a real-time `SAFE` verdict.
- [ ] **Phishing Test**: Scanning a suspicious URL returns a calculated `PHISHING` verdict with explainable risk factors.
- [ ] **PDF Report**: Clicking "Download PDF Report" generates and downloads a professional security summary.
- [ ] **Admin Dashboard**: Logging in with `admin@phishguard.ai` / `Admin@PhishGuard2026!` displays analytics, scans, and model evaluation metrics.
- [ ] **Chrome Extension**: Navigating to a phishing trap triggers the warning interstitial and allows safe bypass without redirect loops.
