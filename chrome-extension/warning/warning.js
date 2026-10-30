// PhishGuard AI – Warning Page Interstitial Controller
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let targetUrl = params.get('url') || '';
  let riskScore = params.get('score') || '';
  let verdict = params.get('verdict') || '';
  let modelVersion = params.get('model') || '';
  let factors = [];

  // Parse factors from query parameters if present
  try {
    const rawFactors = params.get('factors');
    if (rawFactors) {
      factors = JSON.parse(decodeURIComponent(rawFactors));
    }
  } catch (e) {
    console.warn('[Warning Page] Could not parse query factors:', e);
  }

  // Fallback to chrome.storage.local if query params were empty or truncated
  if (!targetUrl || !riskScore || factors.length === 0) {
    try {
      const stored = await chrome.storage.local.get(['phishguard_last_warning']);
      if (stored && stored.phishguard_last_warning) {
        const last = stored.phishguard_last_warning;
        targetUrl = targetUrl || last.url || '';
        riskScore = riskScore || String(last.risk_score || 90);
        verdict = verdict || last.verdict || 'PHISHING';
        modelVersion = modelVersion || last.model_version || 'Machine Learning';
        if (factors.length === 0 && last.factors) {
          factors = last.factors;
        }
      }
    } catch (err) {
      console.warn('[Warning Page] Storage lookup fallback:', err);
    }
  }

  // Populate DOM elements
  const urlBox = document.getElementById('target-url');
  if (urlBox) {
    urlBox.textContent = targetUrl || 'Unknown Suspicious Link';
  }

  const scoreDisplay = document.getElementById('score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = riskScore ? `${riskScore}/100` : '90+/100';
  }

  const verdictLabel = document.getElementById('verdict-label');
  if (verdictLabel) {
    verdictLabel.textContent = (verdict || 'PHISHING').toUpperCase();
  }

  const modelElem = document.getElementById('model-name');
  if (modelElem) {
    modelElem.textContent = `Classifier: ${modelVersion || 'Gradient Boosted Trees'}`;
  }

  // Populate Threat Indicators
  const container = document.getElementById('factors-container');
  if (container) {
    container.innerHTML = '';

    const listToRender = factors.length > 0 ? factors : [
      {
        label: 'Suspicious Domain / Credential Harvesting Pattern',
        severity: 'critical',
        description: 'Multi-layer heuristics and machine learning algorithms detected deceptive infrastructure characteristics.',
        evidence: `Destination: ${targetUrl}`,
      },
    ];

    listToRender.forEach((f) => {
      const item = document.createElement('div');
      const severityClass = (f.severity || 'high').toLowerCase();
      item.className = `factor-item ${severityClass}`;

      item.innerHTML = `
        <div class="factor-top">
          <span class="factor-title">${f.label || 'Threat Factor'}</span>
          <span class="factor-badge">${(f.severity || 'high').toUpperCase()}</span>
        </div>
        <div class="factor-desc">${f.description || 'Risk indicator observed in URL or DOM.'}</div>
        ${f.evidence ? `<div class="factor-evidence">Evidence: ${f.evidence}</div>` : ''}
      `;
      container.appendChild(item);
    });
  }

  // Action Button: Return to Safety
  document.getElementById('btn-return')?.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
  });

  // Action Button: Proceed Anyway (Unsafe) with URL Validation and Loop Prevention
  document.getElementById('btn-proceed')?.addEventListener('click', () => {
    if (!targetUrl) {
      alert('Error: No target URL defined.');
      return;
    }

    // Requirement 8: Validate URL before allowing user to proceed
    let parsedDestination;
    try {
      parsedDestination = new URL(targetUrl);
      if (parsedDestination.protocol !== 'http:' && parsedDestination.protocol !== 'https:') {
        alert(`Disallowed protocol: "${parsedDestination.protocol}". Navigation aborted for your security.`);
        return;
      }
    } catch {
      alert('Security Error: Target URL is malformed or invalid. Cannot proceed.');
      return;
    }

    // Confirmation dialog
    const confirmed = confirm(
      `CRITICAL SECURITY WARNING:\n\nYou are about to proceed to:\n${targetUrl}\n\nThis website has been flagged as a dangerous phishing trap. Entering passwords, personal details, or financial credentials on this page may lead to identity theft or fraud.\n\nDo you still wish to proceed?`
    );

    if (confirmed) {
      // Requirement 7: Prevent redirect loop by whitelisting this URL in background service worker
      chrome.runtime.sendMessage(
        {
          type: 'BYPASS_URL',
          url: targetUrl,
        },
        () => {
          // Navigate to target destination
          window.location.href = targetUrl;
        }
      );
    }
  });
});
