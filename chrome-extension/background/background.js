// PhishGuard AI – Background Service Worker (Manifest V3)
const DEFAULT_API_BASE = 'https://phishguard-backend-3oao.onrender.com/api';

// Memory caches
const scanCache = new Map();            // url -> { data, timestamp }
const inFlightScans = new Map();        // url -> Promise
const bypassedUrls = new Map();         // normalizedUrl -> timestamp
const tabLastScannedUrl = new Map();    // tabId -> url

async function getApiBase() {
  const res = await chrome.storage.local.get(['apiBase']);
  if (!res.apiBase || res.apiBase.includes('localhost:8000') || res.apiBase.includes('127.0.0.1:8000')) {
    chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
    return DEFAULT_API_BASE;
  }
  return res.apiBase;
}

// Clean up tab tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabLastScannedUrl.delete(tabId);
});

// Update badge when user switches active tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab || !tab.url) return;

    if (tab.url.includes('/warning/warning.html')) {
      applyBadge('phishing', activeInfo.tabId);
      return;
    }

    if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
      const normalized = normalizeUrl(tab.url);
      const cached = scanCache.get(normalized);
      if (cached) {
        applyBadge(cached.data.verdict, activeInfo.tabId);
      }
    }
  } catch {}
});

// Initialize extension state on startup / install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['protectionEnabled', 'apiBase', 'recentAlerts', 'bypasses'], (result) => {
    if (result.protectionEnabled === undefined) {
      chrome.storage.local.set({ protectionEnabled: true });
    }
    // Always default to cloud Render backend if unset or legacy localhost
    if (!result.apiBase || result.apiBase.includes('localhost:8000')) {
      chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
    }
    if (!result.recentAlerts) {
      chrome.storage.local.set({ recentAlerts: [] });
    }
    if (result.bypasses && Array.isArray(result.bypasses)) {
      result.bypasses.forEach((u) => bypassedUrls.set(normalizeUrl(u), Date.now()));
    }
  });
  console.log('[PhishGuard AI] Extension initialized and background monitor active.');
});

// Helper: Normalize URL for deduplication and bypass matching
function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return `${u.protocol}//${u.host}${u.pathname}${u.search}`;
  } catch {
    return rawUrl.trim();
  }
}

// Helper: Check if host is local development
function isLocalHost(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const h = u.hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '::1' ||
      h === '0.0.0.0' ||
      h.endsWith('.localhost') ||
      h.endsWith('.test') ||
      h.endsWith('.local')
    );
  } catch {
    return false;
  }
}

// Intercept navigation early before page loads via webNavigation
chrome.webNavigation?.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const targetUrl = details.url;
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) return;

  const res = await chrome.storage.local.get(['protectionEnabled']);
  if (res.protectionEnabled === false) return;

  const apiBase = await getApiBase();
  await processNavigation(targetUrl, details.tabId, apiBase);
});

// Intercept navigation updates via tabs.onUpdated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const targetUrl = changeInfo.url || (changeInfo.status === 'loading' ? tab.url : null);
  if (!targetUrl) return;

  // STRICTLY allow only http and https web navigations!
  // Any chrome://, chrome-error://, about:, chrome-extension:// must be ignored completely!
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return;
  }

  // Prevent duplicate scans for the same tab & URL in rapid succession
  const currentTabUrl = tabLastScannedUrl.get(tabId);
  if (currentTabUrl === targetUrl && changeInfo.status !== 'complete') {
    return;
  }

  tabLastScannedUrl.set(tabId, targetUrl);

  const res = await chrome.storage.local.get(['protectionEnabled']);
  if (res.protectionEnabled === false) return;

  const apiBase = await getApiBase();
  await processNavigation(targetUrl, tabId, apiBase);
});

async function processNavigation(url, tabId, apiBase) {
  const normalized = normalizeUrl(url);

  // 1. Localhost check - Never block local development
  if (isLocalHost(url)) {
    applyBadge('safe', tabId);
    return;
  }

  // 2. Check if user previously clicked "Proceed Anyway" for this URL
  if (bypassedUrls.has(normalized)) {
    console.log('[PhishGuard AI] URL bypassed by user consent:', url);
    applyBadge('bypassed', tabId);
    return;
  }

  // 3. Analyze through backend
  const data = await checkUrlSafety(url, tabId, apiBase);
  if (!data) return;

  // 4. Requirement 2: If verdict is PHISHING and risk score is 70 or above, redirect to warning.html
  if (data.verdict === 'phishing' && data.risk_score >= 70) {
    console.warn(`[PhishGuard AI] Phishing Attack Blocked (${data.risk_score}/100): ${url}`);
    saveRecentAlert(data);
    applyBadge('phishing', tabId);

    // Save warning data in storage so warning.js can access complete indicators
    const warningPayload = {
      url: data.url || url,
      risk_score: data.risk_score,
      verdict: data.verdict,
      model_version: data.model_version || 'Gradient Boosted Trees',
      ml_probability: data.ml_probability || 0.85,
      factors: data.factors || [],
      timestamp: new Date().toISOString(),
    };
    await chrome.storage.local.set({ phishguard_last_warning: warningPayload });

    // Build extension warning URL
    const factorsJson = encodeURIComponent(JSON.stringify(data.factors || []));
    const warningPage = chrome.runtime.getURL(
      `warning/warning.html?url=${encodeURIComponent(url)}&score=${data.risk_score}&verdict=${data.verdict}&model=${encodeURIComponent(data.model_version || 'Gradient Boosted Trees')}&factors=${factorsJson}`
    );

    // Redirect the tab to the warning interstitial
    chrome.tabs.update(tabId, { url: warningPage }).catch((err) => {
      console.error('[PhishGuard AI] Failed to redirect tab:', err.message);
    });
    return;
  }

  // 5. Requirement 3: If verdict is SUSPICIOUS, show a warning banner without automatically blocking
  if (data.verdict === 'suspicious') {
    console.warn(`[PhishGuard AI] Suspicious site warning (${data.risk_score}/100): ${url}`);
    saveRecentAlert(data);
    applyBadge('suspicious', tabId);
    chrome.tabs.sendMessage(tabId, {
      type: 'PHISHGUARD_SECURITY_ALERT',
      data,
    }).catch(() => {});
    return;
  }

  // 6. Requirement 4: If verdict is SAFE, allow normal browsing
  if (data.verdict === 'safe') {
    applyBadge('safe', tabId);
  }
}

async function checkUrlSafety(url, tabId, apiBase) {
  const normalized = normalizeUrl(url);

  // Check 5-minute memory cache
  const cached = scanCache.get(normalized);
  if (cached && Date.now() - cached.timestamp < 300000) {
    applyBadge(cached.data.verdict, tabId);
    return cached.data;
  }

  // Deduplicate in-flight network requests
  if (inFlightScans.has(normalized)) {
    return inFlightScans.get(normalized);
  }

  const scanPromise = (async () => {
    try {
      const response = await fetch(`${apiBase}/extension/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      scanCache.set(normalized, { data, timestamp: Date.now() });
      applyBadge(data.verdict, tabId);
      return data;
    } catch (error) {
      console.warn('[PhishGuard AI] API inspection failed:', error.message);
      applyBadge('offline', tabId);
      return null;
    } finally {
      inFlightScans.delete(normalized);
    }
  })();

  inFlightScans.set(normalized, scanPromise);
  return scanPromise;
}

function applyBadge(verdict, tabId) {
  const badgeConfig = {
    safe: { text: 'SAFE', color: '#10B981' },
    suspicious: { text: 'WARN', color: '#F59E0B' },
    phishing: { text: 'ALERT', color: '#EF4444' },
    bypassed: { text: 'ALLOW', color: '#64748B' },
  }[verdict] || { text: '', color: '#000000' };

  if (tabId) {
    chrome.action.setBadgeText({ text: badgeConfig.text, tabId });
    chrome.action.setBadgeBackgroundColor({ color: badgeConfig.color, tabId });
  } else {
    chrome.action.setBadgeText({ text: badgeConfig.text });
    chrome.action.setBadgeBackgroundColor({ color: badgeConfig.color });
  }
}

function saveRecentAlert(alert) {
  chrome.storage.local.get(['recentAlerts'], (result) => {
    const alerts = result.recentAlerts || [];
    // Prevent duplicate entries for the same URL
    const filtered = alerts.filter((a) => a.url !== alert.url);
    filtered.unshift({
      url: alert.url,
      verdict: alert.verdict,
      risk_score: alert.risk_score,
      model_version: alert.model_version || 'Machine Learning',
      factors: alert.factors || [],
      timestamp: new Date().toISOString(),
    });
    chrome.storage.local.set({ recentAlerts: filtered.slice(0, 25) });
  });
}

// Runtime Message Handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Manual scan from popup
  if (message.type === 'SCAN_CURRENT_TAB') {
    chrome.storage.local.get(['apiBase'], async (res) => {
      const apiBase = res.apiBase || DEFAULT_API_BASE;
      const data = await checkUrlSafety(message.url, message.tabId, apiBase);
      sendResponse({ result: data });
    });
    return true;
  }

  // Whitelist bypass from warning page ("Proceed Anyway")
  if (message.type === 'BYPASS_URL') {
    const targetUrl = message.url;
    if (targetUrl) {
      const normalized = normalizeUrl(targetUrl);
      bypassedUrls.set(normalized, Date.now());

      // Persist bypasses
      chrome.storage.local.get(['bypasses'], (res) => {
        const list = res.bypasses || [];
        if (!list.includes(targetUrl)) {
          list.push(targetUrl);
          chrome.storage.local.set({ bypasses: list.slice(-50) });
        }
      });
      console.log('[PhishGuard AI] Bypass registered for:', normalized);
      sendResponse({ success: true, url: targetUrl });
    }
    return true;
  }

  // Clear local bypasses if user resets
  if (message.type === 'CLEAR_BYPASSES') {
    bypassedUrls.clear();
    chrome.storage.local.set({ bypasses: [] });
    sendResponse({ success: true });
    return true;
  }
});
