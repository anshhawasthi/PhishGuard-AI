# PhishGuard AI – Automated Phishing Website Detection Using Machine Learning

> **Final-Year B.Tech Major Project in Cybersecurity & Artificial Intelligence**  
> *"Detect Phishing Before It Detects You."*

---

## 🛡️ Project Overview

**PhishGuard AI** is an advanced, production-grade cybersecurity application that detects and neutralizes phishing websites in real-time. Traditional blocklists (such as Google Safe Browsing or PhishTank) suffer from **The Threat Window**—they miss the first 2 to 4 hours of an attack when zero-day phishing sites are launched using fast-flux domains and bulletproof hosting.

PhishGuard AI solves this challenge through a multi-layer telemetry engine:
1. **URL Lexical Properties**: Length, subdomains, dots, hyphens, `@` symbol credential tricks, raw IP hosts, shorteners, punycode (homograph attacks), and abnormal TLDs.
2. **Domain & DNS Telemetry**: Authoritative DNS A/AAAA resolution, Shannon entropy (to catch DGA domain generation algorithms), and SSL/TLS certificate verification.
3. **Website DOM Content Telemetry**: SSRF-isolated web page inspection detecting password input fields, external form submissions, empty form targets, and anti-inspection right-click blockers.
4. **Machine Learning Layer**: Trained across 4 distinct algorithms (Logistic Regression, Decision Tree, Random Forest, and Gradient Boosted Trees) with explainable AI (SHAP-style feature attribution).
5. **Chrome Extension (Manifest V3)**: Real-time background navigation interception and threat blocking.

---

## 💻 Technology Stack (MERN Architecture)

| Component | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Recharts, Axios, React Router |
| **Backend** | Node.js, Express.js, TypeScript, Mongoose ODM, JWT Authentication, bcrypt, PDFKit, Cheerio, Axios |
| **Database** | MongoDB & MongoDB Atlas compatibility |
| **Machine Learning** | Algorithmic ML Engine: Logistic Regression, Decision Tree, Random Forest, Gradient Boosted Trees, StandardScaler, Evaluator (Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix) |
| **Browser Extension**| Chrome Extension Manifest V3, Background Service Worker, Content Scripts, Popup UI, Chrome Storage API |
| **Reports** | Automated downloadable PDF Security Audit Reports via PDFKit |
| **Security** | Strict SSRF Protection (RFC 1918, 127.0.0.0/8, 169.254.169.254 cloud metadata blocking) |

---

## 📁 Project Folder Structure

```
phishguard-ai/
├── backend/
│   ├── src/
│   │   ├── config/             # Environment & system configurations
│   │   ├── database/           # MongoDB Mongoose connection handler
│   │   ├── models/             # User, Scan, Dataset, ModelVersion, ActivityLog
│   │   ├── controllers/        # Auth, Scan, Dashboard, Admin, Extension
│   │   ├── routes/             # REST API routes
│   │   ├── middleware/         # JWT Auth, Role Guard, Error Handler
│   │   ├── services/           # SSRF Guard, URL Analyzer, Domain/SSL, Content, PDF
│   │   ├── ml/                 # 4 ML algorithms, Evaluator, Feature Extractor, Datasets
│   │   └── server.ts           # Main Express server entry point
│   ├── datasets/               # Preloaded & uploaded training CSV datasets
│   ├── trained_models/         # Serialized model weights & scaler parameters
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, RiskGauge, AuthModal
│   │   ├── pages/              # LandingPage, ScanResultPage, DashboardPage, AdminPage, BulkScanPage
│   │   ├── contexts/           # AuthContext (JWT, Login, Register, Roles)
│   │   ├── services/           # Axios API Client
│   │   ├── types/              # TypeScript definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
│
├── chrome-extension/
│   ├── manifest.json           # Manifest V3
│   ├── background/             # Background Service Worker (navigation interceptor)
│   ├── content/                # Content Script (in-page warning banner)
│   ├── popup/                  # Popup UI (risk gauge, scan button, toggle)
│   ├── warning/                # Dedicated blocking interstitial page
│   └── assets/                 # Extension icons (16, 48, 128)
│
├── docs/
│   ├── architecture.md         # Full architectural specifications
│   ├── api_documentation.md    # Complete REST API reference
│   └── chrome_extension_guide.md # Extension installation steps
│
├── scripts/
│   ├── start-all.bat           # One-click Windows startup
│   └── start-all.ps1           # Windows PowerShell unified launcher
│
├── docker-compose.yml          # Containerized MongoDB + Backend + Frontend
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start & Execution Instructions

### 1. Start MongoDB
Ensure MongoDB is running locally on port `27017` or supply a MongoDB Atlas connection string in `backend/.env`.
```bash
# To test if MongoDB service is started on Windows:
net start MongoDB
```

### 2. Run Backend
```bash
cd phishguard-ai/backend
npm install
npm run dev
```
The backend server starts on `http://localhost:8000`.  
Health check endpoint: `http://localhost:8000/api/health`.

### 3. Run Frontend
```bash
cd phishguard-ai/frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Or Use One-Click Windows Launcher
Double-click `phishguard-ai/scripts/start-all.bat` or run:
```powershell
powershell -ExecutionPolicy Bypass -File phishguard-ai/scripts/start-all.ps1
```

---

## 🔌 Chrome Extension Installation (Manifest V3)

1. Open **Google Chrome** and navigate to `chrome://extensions`.
2. Toggle on **"Developer mode"** in the top-right corner.
3. Click **"Load unpacked"** in the top-left corner.
4. Select the `phishguard-ai/chrome-extension` directory.
5. The extension is now loaded! Pin it to your toolbar to test real-time website scans.

---

## 🔑 Demo Credentials (For Viva & Presentation)

A default administrator account is automatically bootstrapped on first launch:
- **Admin Email**: `admin@phishguard.ai`
- **Admin Password**: `Admin@PhishGuard2026!`
- *(In the web interface, click "Sign In" and use the **"Fill Demo Admin Credentials"** helper link for instant login during viva presentations).*

---

## 🧪 Automated Testing Suite

To verify all security controls, SSRF protections, feature extraction rules, and all 4 Machine Learning models:
```bash
cd phishguard-ai/backend
npm test
```
**Test Results**: 26 / 26 automated tests passing (100% pass rate).

---

## 📄 License & Academic Attribution
Developed as a final-year B.Tech Major Project in Computer Science & Engineering (Cybersecurity & Artificial Intelligence).
