// PhishGuard AI – Popup Controller
const DEFAULT_API_BASE = 'https://phishguard-backend-3oao.onrender.com/api';
const DEFAULT_DASHBOARD_URL = 'https://phish-guard-ai-kappa-navy.vercel.app/dashboard';
let currentTab = null;

async function getApiBase() {
  const res = await chrome.storage.local.get(['apiBase']);
  if (!res.apiBase || res.apiBase.includes('localhost:8000') || res.apiBase.includes('127.0.0.1:8000')) {
    chrome.storage.local.set({ apiBase: DEFAULT_API_BASE });
    return DEFAULT_API_BASE;
  }
  return res.apiBase;
}

async function getDashboardUrl() {
  const res = await chrome.storage.local.get(['dashboardUrl']);
  if (!res.dashboardUrl || res.dashboardUrl.includes('localhost:5173')) {
    chrome.storage.local.set({ dashboardUrl: DEFAULT_DASHBOARD_URL });
    return DEFAULT_DASHBOARD_URL;
  }
  return res.dashboardUrl;
}

document.addEventListener('DOMContentLoaded', async () => {
  await initActiveTab();
  await checkBackendStatus();
  loadProtectionToggle();
  loadRecentAlerts();
  initSettingsPanel();

  document.getElementById('btn-scan')?.addEventListener('click', () => {
    if (currentTab && currentTab.url) {
      triggerScan(currentTab.url, currentTab.id);
    }
  });

  document.getElementById('protection-toggle')?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    chrome.storage.local.set({ protectionEnabled: isEnabled });
    document.getElementById('toggle-sub').textContent = isEnabled
      ? 'AI Engine Monitoring Active'
      : 'Real-Time Protection Disabled';
  });

  document.getElementById('clear-alerts')?.addEventListener('click', () => {
    chrome.storage.local.set({ recentAlerts: [] }, () => {
      loadRecentAlerts();
    });
  });

  document.getElementById('btn-open-dashboard')?.addEventListener('click', async () => {
    const dashboardUrl = await getDashboardUrl();
    chrome.tabs.create({ url: dashboardUrl });
  });
});

function initSettingsPanel() {
  const toggleBtn = document.getElementById('btn-settings-toggle');
  const panel = document.getElementById('settings-panel');
  const saveBtn = document.getElementById('btn-save-settings');
  const apiInput = document.getElementById('setting-api-url');
  const dashInput = document.getElementById('setting-dashboard-url');
  const savedMsg = document.getElementById('settings-saved-msg');

  // Prepopulate current values
  chrome.storage.local.get(['apiBase', 'dashboardUrl'], (res) => {
    if (apiInput) apiInput.value = res.apiBase || DEFAULT_API_BASE;
    if (dashInput) dashInput.value = res.dashboardUrl || DEFAULT_DASHBOARD_URL;
  });

  toggleBtn?.addEventListener('click', () => {
    if (panel) {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
  });

  saveBtn?.addEventListener('click', async () => {
    let newApi = apiInput?.value.trim().replace(/\/$/, '') || DEFAULT_API_BASE;
    if (newApi && !newApi.endsWith('/api')) {
      newApi = `${newApi}/api`;
      if (apiInput) apiInput.value = newApi;
    }
    const newDash = dashInput?.value.trim().replace(/\/$/, '') || DEFAULT_DASHBOARD_URL;
    await chrome.storage.local.set({ apiBase: newApi, dashboardUrl: newDash });

    if (savedMsg) {
      savedMsg.style.display = 'inline';
      setTimeout(() => {
        savedMsg.style.display = 'none';
      }, 2500);
    }
    await checkBackendStatus();
  });
}

async function initActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs[0]) return;

  currentTab = tabs[0];
  const tabUrl = currentTab.url || '';
  const urlElem = document.getElementById('active-url');

  // Case A: Tab is on the Warning Interstitial (chrome-extension://.../warning.html)
  if (tabUrl.includes('/warning/warning.html')) {
    try {
      const parsed = new URL(tabUrl);
      const original = parsed.searchParams.get('url');
      const score = parseInt(parsed.searchParams.get('score') || '85', 10);
      const verdict = parsed.searchParams.get('verdict') || 'phishing';
      const model = parsed.searchParams.get('model') || 'Gradient Boosted Trees';
      let factors = [];
      try {
        factors = JSON.parse(decodeURIComponent(parsed.searchParams.get('factors') || '[]'));
      } catch {}

      if (urlElem) {
        urlElem.textContent = original || 'Dangerous Phishing Target';
        urlElem.title = original || '';
      }

      renderScanResult({
        risk_score: score,
        verdict: verdict,
        model_version: model,
        ml_probability: 0.85,
        factors: factors.length > 0 ? factors : [{ label: 'High-Risk Phishing Threat', severity: 'high' }]
      });
      return;
    } catch (e) {
      console.warn('Could not parse warning URL parameters:', e);
    }
  }

  // Case B: Tab is on the Web App viewing an evaluated URL report (?url=...)
  if (tabUrl.includes('?url=')) {
    try {
      const parsed = new URL(tabUrl);
      const embeddedUrl = parsed.searchParams.get('url');
      if (embeddedUrl && (embeddedUrl.startsWith('http://') || embeddedUrl.startsWith('https://'))) {
        if (urlElem) {
          urlElem.textContent = embeddedUrl;
          urlElem.title = embeddedUrl;
        }
        triggerScan(embeddedUrl, currentTab.id);
        return;
      }
    } catch {}
  }

  // Case C: Standard Navigation
  if (urlElem) {
    urlElem.textContent = tabUrl || 'No active URL';
    urlElem.title = tabUrl || '';
  }

  if (tabUrl && (tabUrl.startsWith('http://') || tabUrl.startsWith('https://'))) {
    triggerScan(tabUrl, currentTab.id);
  }
}

async function checkBackendStatus() {
  const dot = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');

  try {
    let apiBase = await getApiBase();
    if (apiBase && !apiBase.endsWith('/api')) {
      apiBase = `${apiBase.replace(/\/$/, '')}/api`;
    }

    if (text) text.textContent = 'Checking...';
    if (dot) dot.style.background = '#F59E0B';

    const res = await fetch(`${apiBase}/extension/status`, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const data = await res.json();
      if (dot) {
        dot.className = 'status-dot';
        dot.style.background = '#10B981';
      }
      if (text) text.textContent = 'Engine Online';
    } else {
      throw new Error('API status not 200');
    }
  } catch {
    if (dot) {
      dot.className = 'status-dot offline';
      dot.style.background = '#EF4444';
    }
    if (text) text.textContent = 'Backend Offline';
  }
}

function loadProtectionToggle() {
  chrome.storage.local.get(['protectionEnabled'], (res) => {
    const isEnabled = res.protectionEnabled !== false;
    const toggle = document.getElementById('protection-toggle');
    if (toggle) toggle.checked = isEnabled;
    const sub = document.getElementById('toggle-sub');
    if (sub) {
      sub.textContent = isEnabled ? 'AI Engine Monitoring Active' : 'Real-Time Protection Disabled';
    }
  });
}

async function triggerScan(url, tabId) {
  const btn = document.getElementById('btn-scan');
  if (btn) btn.textContent = 'Scanning Website...';

  try {
    const apiBase = await getApiBase();
    const response = await fetch(`${apiBase}/extension/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) throw new Error('Analysis request failed');
    const data = await response.json();
    renderScanResult(data);
  } catch (err) {
    console.error('Scan error:', err);
    document.getElementById('verdict-pill').textContent = 'SCAN ERROR';
    document.getElementById('verdict-pill').className = 'verdict-pill suspicious';
    document.getElementById('verdict-model').textContent = 'Check backend connection';
  } finally {
    if (btn) btn.innerHTML = '<span class="btn-icon">⚡</span> Scan Website Now';
  }
}

function renderScanResult(data) {
  const circle = document.getElementById('score-circle');
  const scoreNum = document.getElementById('score-num');
  const pill = document.getElementById('verdict-pill');
  const modelText = document.getElementById('verdict-model');
  const factorsContainer = document.getElementById('factors-preview');

  scoreNum.textContent = data.risk_score;
  pill.textContent = data.verdict.toUpperCase();
  modelText.textContent = `Model: ${data.model_version} (${Math.round(data.ml_probability * 100)}%)`;

  circle.className = `score-circle ${data.verdict}`;
  pill.className = `verdict-pill ${data.verdict}`;

  factorsContainer.innerHTML = '';
  if (data.factors && data.factors.length > 0) {
    data.factors.slice(0, 3).forEach((f) => {
      const tag = document.createElement('div');
      tag.className = `factor-tag ${f.severity}`;
      tag.textContent = `[${f.severity.toUpperCase()}] ${f.label}`;
      factorsContainer.appendChild(tag);
    });
  } else {
    const tag = document.createElement('div');
    tag.className = 'factor-tag';
    tag.textContent = 'No major threat factors detected';
    factorsContainer.appendChild(tag);
  }
}

function loadRecentAlerts() {
  chrome.storage.local.get(['recentAlerts'], (res) => {
    const list = document.getElementById('alerts-list');
    if (!list) return;
    const alerts = res.recentAlerts || [];

    if (alerts.length === 0) {
      list.innerHTML = '<div class="empty-state">No threats detected recently</div>';
      return;
    }

    list.innerHTML = '';
    alerts.slice(0, 5).forEach((item) => {
      const row = document.createElement('div');
      row.className = 'alert-row';
      row.innerHTML = `
        <span class="alert-url" title="${item.url}">${item.url}</span>
        <span class="alert-badge ${item.verdict}">${item.risk_score} - ${item.verdict.toUpperCase()}</span>
      `;
      list.appendChild(row);
    });
  });
}
