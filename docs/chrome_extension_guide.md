# PhishGuard AI – Chrome Browser Extension Installation Guide

**Manifest V3 Real-Time Browser Protection**

---

## 1. Prerequisites
Ensure that the PhishGuard AI Backend is running on `http://localhost:8000`.

---

## 2. Step-by-Step Installation in Google Chrome

1. Open **Google Chrome** on your computer.
2. In the URL address bar, enter:
   ```
   chrome://extensions
   ```
   and press Enter.
3. In the top-right corner of the Extensions page, enable the **"Developer mode"** toggle switch.
4. In the top-left corner, click the **"Load unpacked"** button.
5. In the file explorer dialog, navigate to your project directory and select the folder:
   ```
   phishguard-ai/chrome-extension
   ```
6. Click **Select Folder**.
7. You will immediately see **"PhishGuard AI – Browser Protection"** (Version 1.0.0) loaded into your extension list.
8. (Optional) Click the Chrome puzzle-piece extension icon in your browser toolbar and pin **PhishGuard AI** to your toolbar for quick access.

---

## 3. How to Demonstrate in Project Viva

1. **Check Extension Status**:
   - Click the pinned PhishGuard AI shield icon in your toolbar.
   - The popup opens, displaying a green **"Engine Online"** status indicator and your current active URL.

2. **Test Legitimate Website**:
   - Navigate to `https://github.com` or `https://google.com`.
   - Open the extension popup or observe the extension badge icon: It will display a green **"SAFE"** badge with a low risk score.

3. **Test Phishing Website**:
   - In the popup, click "Scan Website Now" with a known phishing sample or navigate to:
     `http://paypal-security-update.account-verification.ga/login.php`
   - The extension badge turns **RED ("DANGER")**, the popup displays a high risk score (90+), and detected threat factors are listed.
   - The in-page warning banner renders at the top of the webpage.

4. **Dedicated Warning Screen**:
   - You can also navigate directly to `chrome-extension://<id>/warning/warning.html?url=...` to demonstrate the blocking interstitial screen.
