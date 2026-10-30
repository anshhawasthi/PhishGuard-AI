# PhishGuard AI – System Architecture Documentation

**Final-Year B.Tech Major Project in Cybersecurity & Artificial Intelligence**

---

## 1. Executive Summary & Core Objective

PhishGuard AI is an automated, real-time phishing website detection and zero-day threat intelligence platform. Traditional defense systems rely primarily on reactive static blocklists (such as Google Safe Browsing or PhishTank). While effective against established threats, blocklists have a critical vulnerability: **The Threat Window**. Modern phishing campaigns utilize disposable bulletproof hosting, fast-flux DNS, and newly registered domains (NRDs) that execute their attacks within the first 2 to 4 hours—well before manual reporting and blacklisting occur.

PhishGuard AI eliminates this threat window by extracting multi-layer feature representations (URL lexical, domain DNS/SSL, and website DOM characteristics) and classifying websites in real-time through an ensemble of trained Machine Learning classifiers.

---

## 2. Technology Stack (MERN Architecture)

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React, Recharts.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM, JWT Authentication, bcrypt, PDFKit.
- **Database**: MongoDB (Collections: `users`, `scans`, `datasets`, `model_versions`, `activity_logs`). Compatible with local MongoDB and MongoDB Atlas.
- **Machine Learning Layer**:
  1. Binary Logistic Regression (L2 regularization)
  2. CART Decision Tree Classifier (Gini Impurity reduction)
  3. Random Forest (Bootstrap bagging & feature subspacing)
  4. Gradient Boosted Decision Trees (XGBoost / LightGBM style pseudo-residual boosting)
  5. Explainable AI (SHAP-style relative feature attribution)
- **Browser Protection**: Chrome Extension Manifest V3 (Background Service Worker, Content Scripts, Popup UI, Chrome Storage API, Dedicated Blocking Interstitial).

---

## 3. End-to-End Detection Pipeline

```
[Target URL (Web/Extension/Bulk)]
               │
               ▼
   [01. SSRF & Protocol Gate] ──── (Blocks Private IPs, Cloud Metadata, Localhost)
               │
               ▼
  [02. Multi-Layer Extraction]
       ├─ URL Lexical Parser (Length, Subdomains, TLDs, Shorteners, Punycode, @ trick)
       ├─ Domain & DNS Telemetry (DNS Resolution, Shannon Entropy, IP lookup)
       ├─ SSL/TLS Certificate Inspector (Validity, Issuer, Days to Expiry)
       └─ DOM Content Analyzer (Forms, External actions, Password fields, Hidden iframes)
               │
               ▼
    [03. Feature Vectorization] ──── (Standard Scaling & 27-Feature Tensor)
               │
               ▼
   [04. Active ML Model Inference] ── (Gradient Boosted Trees / Random Forest)
               │
               ▼
  [05. Hybrid Explainable Scorer]
       ├─ Risk Score (0 - 100 Index)
       ├─ Machine Learning Probability (0.0 - 1.0)
       ├─ Verdict: SAFE | SUSPICIOUS | PHISHING
       └─ Categorized Threat Indicators with Evidence & Severity
               │
               ▼
    [06. Delivery & Persistence]
       ├─ Web Presentation / Gauge UI
       ├─ Chrome Extension Real-time Badge & Banner
       ├─ MongoDB Scans Collection
       └─ Downloadable PDF Security Audit Report
```

---

## 4. Feature Engineering Matrix (27 Indicators)

### A. URL Lexical Properties
1. `urlLength`: Total character length of URL.
2. `domainLength`: Character length of the fully qualified domain name.
3. `numDots`: Frequency of '.' characters.
4. `numSubdomains`: Depth of subdomain levels.
5. `numHyphens`: Hyphens in domain and path.
6. `numSpecialChars`: Count of special tokens (`?`, `=`, `&`, `_`, `%`, `+`, `$`).
7. `hasIpHost`: Detection of raw IPv4/IPv6 address instead of registered domain.
8. `hasAtSymbol`: Detection of `@` character (used to discard prefix and spoof authority).
9. `isShortener`: Detection of link-shortening services (bit.ly, tinyurl, t.co, is.gd).
10. `hasSuspiciousTld`: Abuse-prone TLDs (.tk, .ml, .ga, .cf, .gq, .xyz, .top, .work, .loan).
11. `hasBrandInSubdomain`: Brand keyword in subdomain or path when root domain is unrelated.
12. `hasPunycode`: Detection of `xn--` or non-ASCII characters (homograph spoofing).
13. `numEncodedChars`: Count of URL hex escape sequences (`%20`, `%3D`).
14. `pathDepth`: Directory nesting level.
15. `queryLength`: Length of query parameters string.
16. `numQueries`: Total count of query parameters.
17. `numRedirectTokens`: Embedded redirection indicators (`//`, `redirect=`, `url=`).
18. `hasLoginKeyword`: Credential-harvesting keywords (`login`, `signin`, `verify`, `banking`).

### B. Domain & Network Telemetry
19. `isHttps`: Verification of TLS encrypted transport protocol.
20. `dnsResolves`: Verification of active authoritative DNS A/AAAA records.
21. `domainEntropy`: Shannon entropy measuring algorithmic domain generation (DGA).

### C. Web Page DOM & Content
22. `hasPasswordField`: Presence of `<input type="password">`.
23. `externalFormAction`: HTML form action transmitting credentials to an external domain.
24. `emptyFormAction`: Form action pointing to `#`, `about:blank`, or empty string.
25. `suspiciousIframe`: Zero-pixel or hidden `<iframe>` elements.
26. `disabledRightClick`: JavaScript preventing context-menu inspection.
27. `hiddenElementsCount`: Total count of invisible or stealth DOM inputs.

---

## 5. Security & SSRF Protection Architecture

To ensure security while scanning external URLs, PhishGuard AI implements strict SSRF guards:
- **Private Subnet Blocking**: Validates resolved DNS IP addresses against RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
- **Loopback & Metadata Blocking**: Blocks `127.0.0.0/8`, `::1`, and cloud provider metadata IPs (`169.254.169.254`, `metadata.google.internal`).
- **Redirect Validation**: Validates every intermediate redirect target against the SSRF guard before following.
- **Resource Constraints**: Enforces a 4000ms network timeout and a 2MB maximum payload limit. Never executes remote JavaScript.
