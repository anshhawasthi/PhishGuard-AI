// PhishGuard AI – Content Script
(function () {
  // Listen for security alerts from background script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'PHISHGUARD_SECURITY_ALERT') {
      renderWarningBanner(message.data);
    }
  });

  function renderWarningBanner(alertData) {
    if (document.getElementById('phishguard-alert-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'phishguard-alert-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(135deg, #7F1D1D 0%, #111827 100%);
      color: #F8FAFC;
      z-index: 2147483647;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
      border-bottom: 2px solid #EF4444;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
      animation: phishguard-slide-down 0.4s ease-out;
    `;

    const isPhish = alertData.verdict === 'phishing';
    const titleText = isPhish ? 'CRITICAL SECURITY THREAT DETECTED' : 'SUSPICIOUS WEBSITE WARNING';

    banner.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="background: #EF4444; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; flex-shrink: 0;">
          ⚠
        </div>
        <div>
          <div style="font-weight: 700; font-size: 13px; letter-spacing: 0.5px; color: #FCA5A5;">
            PHISHGUARD AI: ${titleText}
          </div>
          <div style="font-size: 12px; color: #E2E8F0; margin-top: 2px;">
            Risk Score: <strong>${alertData.risk_score}/100</strong> (${alertData.verdict.toUpperCase()}).
            This website displays strong indicators of phishing, spoofing, or credential theft.
          </div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
        <button id="phishguard-leave-btn" style="background: #EF4444; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer;">
          Back to Safety
        </button>
        <button id="phishguard-dismiss-btn" style="background: rgba(255,255,255,0.15); color: #E2E8F0; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;">
          Dismiss
        </button>
      </div>
    `;

    document.body.prepend(banner);

    document.getElementById('phishguard-leave-btn')?.addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });

    document.getElementById('phishguard-dismiss-btn')?.addEventListener('click', () => {
      banner.remove();
    });
  }
})();
