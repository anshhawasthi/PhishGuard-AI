# PhishGuard AI – REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. Authentication Endpoints

### POST `/auth/register`
Creates a new user account.
- **Request Body**:
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "message": "Account created successfully",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65b...",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "role": "user"
    }
  }
  ```

### POST `/auth/login`
Authenticates user and returns JWT token.
- **Request Body**:
  ```json
  {
    "email": "admin@phishguard.ai",
    "password": "Admin@PhishGuard2026!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "65b...",
      "full_name": "System Administrator",
      "email": "admin@phishguard.ai",
      "role": "admin"
    }
  }
  ```

### GET `/auth/me`
Retrieves authenticated user profile.
- **Headers**: `Authorization: Bearer <token>`

---

## 2. URL Scanner Endpoints

### POST `/scans/analyze`
Analyzes a URL through the complete multi-layer ML engine.
- **Request Body**:
  ```json
  {
    "url": "http://paypal-security-update.account-verification.ga/login.php"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "scanId": "65bfa710...",
    "original_url": "http://paypal-security-update.account-verification.ga/login.php",
    "normalized_url": "http://paypal-security-update.account-verification.ga/login.php",
    "verdict": "phishing",
    "risk_score": 95,
    "ml_prediction": "phishing",
    "ml_probability": 0.984,
    "model_version": "Gradient Boosted Trees",
    "detected_factors": [
      {
        "id": "brand_spoofing",
        "label": "Brand Impersonation in Subdomain/Path",
        "severity": "high",
        "description": "A well-known brand keyword was found in the subdomain...",
        "evidence": "Target domain: account-verification.ga, Subdomain: paypal-security-update"
      }
    ],
    "domain_analysis": { ... },
    "ssl_analysis": { ... },
    "content_analysis": { ... },
    "scan_status": "completed",
    "created_at": "2026-10-30T14:30:00.000Z"
  }
  ```

### GET `/scans`
Retrieves scans with pagination and filtering.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `verdict`: Filter by `safe`, `suspicious`, or `phishing`
  - `search`: URL substring search

### GET `/scans/:scan_id`
Retrieves details for a specific scan ID.

### DELETE `/scans/:scan_id`
Deletes a scan record. Requires authentication.

### POST `/scans/bulk`
Processes a batch of URLs via JSON array or multipart CSV file.

### GET `/scans/:scan_id/report`
Generates and downloads a PDF security report.

---

## 3. Chrome Extension Endpoints

### POST `/extension/analyze`
Optimized high-speed analysis endpoint for background service worker.
- **Request Body**: `{"url": "https://target-url.com"}`

### GET `/extension/status`
Health check and engine status for extension popup.
