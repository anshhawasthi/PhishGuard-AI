import { IUrlFeatures } from '../ml/types';
import { IDetectedFactor } from '../models/Scan';
import { IDomainAnalysis, ISslAnalysis } from './domainAnalyzer';
import { IContentAnalysis } from './contentAnalyzer';
import { isLocalDevHost } from '../ml/featureExtractor';

export interface IRiskScoreResult {
  riskScore: number; // 0 to 100
  verdict: 'safe' | 'suspicious' | 'phishing';
  detectedFactors: IDetectedFactor[];
}

export function computeRiskScore(
  url: string,
  features: IUrlFeatures,
  domainAnalysis: IDomainAnalysis,
  sslAnalysis: ISslAnalysis,
  contentAnalysis: IContentAnalysis,
  mlProbability: number
): IRiskScoreResult {
  // Check for localhost or local development environment first
  const hostToCheck = domainAnalysis.domain || '';
  let parsedHost = '';
  try {
    parsedHost = new URL(url.startsWith('http') ? url : `http://${url}`).hostname;
  } catch {}

  if (isLocalDevHost(hostToCheck) || isLocalDevHost(parsedHost)) {
    return {
      riskScore: 0,
      verdict: 'safe',
      detectedFactors: [
        {
          id: 'local_dev_environment',
          label: 'Local Development Environment',
          severity: 'low',
          description: 'This URL points to your local machine, loopback, or development workstation address.',
          evidence: `Host: ${parsedHost || hostToCheck || 'localhost'}`,
        },
      ],
    };
  }

  const factors: IDetectedFactor[] = [];
  let score = 0;

  // 1. IP-based Host Detection (Critical)
  if (features.hasIpHost) {
    score += 35;
    factors.push({
      id: 'ip_host',
      label: 'IP-Based Host Address',
      severity: 'critical',
      description: 'Host uses a raw numerical IP address instead of a registered domain name, heavily correlated with rogue phishing servers.',
      evidence: `Host: ${domainAnalysis.domain || url}`,
    });
  }

  // 2. @ Symbol Detection (Critical)
  if (features.hasAtSymbol) {
    score += 25;
    factors.push({
      id: 'at_symbol',
      label: '@ Credential Obfuscation',
      severity: 'high',
      description: 'URL contains the "@" character, which browsers interpret by discarding everything before the symbol to reach a spoofed destination.',
      evidence: `URL contains '@'`,
    });
  }

  // 3. Brand Keyword Spoofing (High)
  if (features.hasBrandInSubdomain) {
    score += 30;
    factors.push({
      id: 'brand_spoofing',
      label: 'Brand Impersonation in Subdomain/Path',
      severity: 'high',
      description: 'A well-known brand keyword was found in the subdomain or path of an unrelated domain, a hallmark tactic of credential harvesters.',
      evidence: `Target domain: ${domainAnalysis.domain}, Subdomain: ${domainAnalysis.subdomain}`,
    });
  }

  // 4. Suspicious / Abused TLD (High)
  if (features.hasSuspiciousTld) {
    score += 20;
    factors.push({
      id: 'suspicious_tld',
      label: 'High-Risk Top Level Domain',
      severity: 'high',
      description: `The domain uses ".${domainAnalysis.tld}", a top-level domain frequently associated with automated spam campaigns and disposable phishing kits.`,
      evidence: `TLD: .${domainAnalysis.tld}`,
    });
  }

  // 5. Punycode / Homograph Spoofing (Critical)
  if (features.hasPunycode) {
    score += 35;
    factors.push({
      id: 'punycode_homograph',
      label: 'Punycode / Homograph Spoofing',
      severity: 'critical',
      description: 'The domain uses internationalized characters (punycode "xn--") to visually impersonate a trusted legitimate brand.',
      evidence: `Host: ${domainAnalysis.domain}`,
    });
  }

  // 6. URL Shortener Cloaking (Medium)
  if (features.isShortener) {
    score += 15;
    factors.push({
      id: 'url_shortener',
      label: 'URL Shortener Cloaking',
      severity: 'medium',
      description: 'The link uses a generic URL shortening service that conceals the true final destination from security scanners.',
      evidence: `Shortener host: ${domainAnalysis.domain}`,
    });
  }

  // 7. Excessive Subdomains (Medium)
  if (features.numSubdomains >= 3) {
    score += 15;
    factors.push({
      id: 'excessive_subdomains',
      label: 'Abnormal Subdomain Nesting',
      severity: 'medium',
      description: `The URL contains ${features.numSubdomains} subdomain levels, often used to bypass basic domain reputation filters.`,
      evidence: `Subdomains: ${domainAnalysis.subdomain}`,
    });
  }

  // 8. Heavy Query String (Low/Medium - matching PPT slide 13)
  if (features.queryLength > 80 || features.numQueries >= 4) {
    score += 10;
    factors.push({
      id: 'heavy_query_string',
      label: 'Heavy Query String',
      severity: 'low',
      description: 'A very long query string can be used to pass redirect or tracking data that obscures the real target.',
      evidence: `Query length: ${features.queryLength} chars, ${features.numQueries} params`,
    });
  }

  // 9. Insecure HTTP (Medium)
  if (!sslAnalysis.has_https) {
    score += 15;
    factors.push({
      id: 'no_https',
      label: 'Insecure Protocol (Plain HTTP)',
      severity: 'medium',
      description: 'Communication is not encrypted with HTTPS. Browsing or submitting sensitive info over plain HTTP exposes data to eavesdropping.',
      evidence: 'Protocol: http://',
    });
  }

  // 10. DNS Resolution Failure (Low/Informational - DNS failure alone is never proof of phishing)
  if (!domainAnalysis.dns_resolves) {
    score += 5;
    factors.push({
      id: 'dns_unresolved',
      label: 'Unresolved / Inactive Domain',
      severity: 'low',
      description: 'The domain does not currently resolve via authoritative public DNS. It may be dormant, private, or experiencing temporary network disruption.',
      evidence: `Host ${domainAnalysis.domain} has no active DNS records`,
    });
  }

  // 11. High Domain Entropy (Medium)
  if (domainAnalysis.entropy > 3.8) {
    score += 15;
    factors.push({
      id: 'high_entropy',
      label: 'Algorithmic Domain Pattern (DGA)',
      severity: 'medium',
      description: 'The domain name exhibits unusually high Shannon entropy, characteristic of Domain Generation Algorithms used by botnets.',
      evidence: `Entropy score: ${domainAnalysis.entropy}`,
    });
  }

  // 12. External Form Submission (High)
  if (contentAnalysis.external_form_action) {
    score += 30;
    factors.push({
      id: 'external_form_action',
      label: 'External Form Action',
      severity: 'high',
      description: 'The page contains an HTML form that transmits submitted user input to a completely different external domain.',
      evidence: 'Form action points across domains',
    });
  }

  // 13. Password Field on Insecure / High-Risk Page (High)
  if (contentAnalysis.has_password_field && (!sslAnalysis.has_https || score >= 25)) {
    score += 25;
    factors.push({
      id: 'password_harvesting',
      label: 'Credential Harvester Field',
      severity: 'high',
      description: 'Password input field detected on a page with suspicious domain characteristics or unencrypted protocol.',
      evidence: 'input[type="password"] detected',
    });
  }

  // 14. Hidden Stealth Elements / Iframes (Medium)
  if (contentAnalysis.suspicious_iframes_count > 0 || contentAnalysis.hidden_elements_count > 8) {
    score += 15;
    factors.push({
      id: 'hidden_elements',
      label: 'Hidden Iframes / Stealth DOM Elements',
      severity: 'medium',
      description: 'Hidden zero-pixel iframes or excessive invisible DOM elements detected, commonly used in clickjacking or background credential relays.',
      evidence: `${contentAnalysis.suspicious_iframes_count} hidden iframes, ${contentAnalysis.hidden_elements_count} hidden elements`,
    });
  }

  // 15. Disabled Right-Click (Low)
  if (contentAnalysis.disabled_right_click) {
    score += 10;
    factors.push({
      id: 'anti_inspection',
      label: 'Anti-Inspection Script (Right-Click Disabled)',
      severity: 'low',
      description: 'The website executes scripts to prevent right-clicking or developer tools inspection, common on counterfeit login clones.',
      evidence: 'Context menu prevention code detected',
    });
  }

  // If no major threat factors were found
  if (factors.length === 0) {
    factors.push({
      id: 'clean_baseline',
      label: 'No Major Threat Indicators',
      severity: 'low',
      description: 'URL lexical structure, domain DNS records, and security features align with legitimate web conventions.',
      evidence: 'All security checks passed within nominal baseline limits',
    });
  }

  // Cap score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine whether any positive phishing heuristic was detected
  const hasPositivePhishIndicator =
    features.hasIpHost === 1 ||
    features.hasAtSymbol === 1 ||
    features.hasBrandInSubdomain === 1 ||
    features.hasPunycode === 1 ||
    contentAnalysis.external_form_action ||
    (contentAnalysis.has_password_field && score >= 25) ||
    (features.hasSuspiciousTld === 1 && features.hasLoginKeyword === 1);

  // Determine verdict: Phishing only when score >= 70 with positive phishing indicators or high ML confidence
  let verdict: 'safe' | 'suspicious' | 'phishing' = 'safe';
  if ((normalizedScore >= 70 && hasPositivePhishIndicator) || mlProbability >= 0.78) {
    verdict = 'phishing';
  } else if (normalizedScore >= 30 || mlProbability >= 0.45) {
    verdict = 'suspicious';
  } else {
    verdict = 'safe';
  }

  return {
    riskScore: normalizedScore,
    verdict,
    detectedFactors: factors,
  };
}
