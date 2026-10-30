import { parse } from 'tldts';
import { IUrlFeatures, FEATURE_NAMES } from './types';

export const SUSPICIOUS_TLDS = new Set([
  'tk', 'ml', 'ga', 'cf', 'gq', 'xyz', 'top', 'work', 'loan', 'click',
  'country', 'kim', 'science', 'review', 'party', 'download', 'racing', 'stream',
  'bid', 'faith', 'date', 'wang', 'men', 'win', 'accountant', 'cricket'
]);

export const SHORTENER_DOMAINS = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly',
  'is.gd', 'buff.ly', 'rebrand.ly', 'shorturl.at', 'cutt.ly',
  'rb.gy', 'shorte.st', 'adf.ly', 'bc.vc', 'bl.ink'
]);

export const BRAND_KEYWORDS = [
  'google', 'facebook', 'amazon', 'apple', 'microsoft', 'paypal',
  'netflix', 'instagram', 'twitter', 'linkedin', 'bank', 'chase',
  'wellsfargo', 'citi', 'amex', 'americanexpress', 'outlook',
  'office365', 'dhl', 'fedex', 'ups', 'usps', 'irs', 'tax',
  'crypto', 'coinbase', 'binance', 'metamask', 'wallet', 'steam',
  'discord', 'github', 'dropbox', 'icloud', 'yahoo', 'adobe'
];

export const LOGIN_KEYWORDS = [
  'login', 'signin', 'sign-in', 'log-in', 'verify', 'verification',
  'authenticate', 'account', 'update', 'banking', 'secure', 'password',
  'credential', 'wallet', 'confirm', 'validation', 'security'
];

export function isLocalDevHost(hostname: string): boolean {
  if (!hostname) return false;
  const h = hostname.toLowerCase().trim();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '0.0.0.0' ||
    h.endsWith('.localhost') ||
    h.endsWith('.test') ||
    h.endsWith('.local') ||
    h.endsWith('.lan')
  );
}

/**
 * Calculates Shannon Entropy of a string to detect algorithmic domain generation (DGA)
 */
export function calculateEntropy(str: string): number {
  if (!str) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }
  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(4));
}

export function extractUrlFeatures(
  rawUrl: string,
  extraSignals?: {
    dnsResolves?: boolean;
    hasPasswordField?: boolean;
    externalFormAction?: boolean;
    emptyFormAction?: boolean;
    suspiciousIframe?: boolean;
    disabledRightClick?: boolean;
    hiddenElementsCount?: number;
  }
): { features: IUrlFeatures; vector: number[] } {
  let normalized = rawUrl.trim();
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    // If URL parsing fails, create a safe fallback
    parsedUrl = new URL('http://invalid-url.com');
  }

  const parsedDomain = parse(parsedUrl.hostname);
  const hostname = (parsedUrl.hostname || '').toLowerCase();
  const pathname = parsedUrl.pathname || '';
  const search = parsedUrl.search || '';
  const publicSuffix = (parsedDomain.publicSuffix || '').toLowerCase();
  const domainWithoutSuffix = (parsedDomain.domainWithoutSuffix || '').toLowerCase();
  const subdomains = (parsedDomain.subdomain || '').toLowerCase();

  // 1. URL Length
  const urlLength = rawUrl.length;

  // 2. Domain Length
  const domainLength = hostname.length;

  // 3. Number of dots
  const numDots = (hostname.match(/\./g) || []).length;

  // 4. Number of subdomains
  const numSubdomains = subdomains ? subdomains.split('.').filter(Boolean).length : 0;

  // 5. Number of hyphens in hostname + path
  const numHyphens = (hostname.match(/-/g) || []).length + (pathname.match(/-/g) || []).length;

  // 6. Number of special characters in URL
  const specialChars = (rawUrl.match(/[_?=&~%+$;!*^()]/g) || []).length;

  // 7. IP-based Host Detection (e.g. 192.168.1.1, 45.33.32.156)
  const isIpV4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const isIpV6 = hostname.includes(':') && !hostname.includes('.');
  const isLocal = isLocalDevHost(hostname);
  const hasIpHost = (isIpV4 || isIpV6) && !isLocal ? 1 : 0;

  // 8. @ Symbol Detection (used to truncate or spoof URL credential authority)
  const hasAtSymbol = rawUrl.includes('@') ? 1 : 0;

  // 9. URL Shortener Detection
  const isShortener = SHORTENER_DOMAINS.has(hostname) ? 1 : 0;

  // 10. Suspicious TLD Detection
  const hasSuspiciousTld = SUSPICIOUS_TLDS.has(publicSuffix) ? 1 : 0;

  // 11. Brand Keyword in Subdomain or Path when not matching registered domain
  let hasBrandInSubdomain = 0;
  for (const brand of BRAND_KEYWORDS) {
    if ((subdomains.includes(brand) || pathname.includes(brand)) && domainWithoutSuffix !== brand) {
      hasBrandInSubdomain = 1;
      break;
    }
  }

  // 12. Punycode detection (xn-- or homograph attacks)
  const hasPunycode = hostname.startsWith('xn--') || hostname.includes('.xn--') || /[^\x00-\x7F]/.test(hostname) ? 1 : 0;

  // 13. URL encoded patterns (%20, %3D, etc.)
  const numEncodedChars = (rawUrl.match(/%[0-9a-fA-F]{2}/g) || []).length;

  // 14. Path depth
  const pathDepth = pathname.split('/').filter(Boolean).length;

  // 15. Query Length
  const queryLength = search.length;

  // 16. Number of Query Parameters
  const numQueries = search ? search.slice(1).split('&').filter(Boolean).length : 0;

  // 17. Redirect Tokens in path / query (e.g. //, redirect=, url=, dest=)
  const redirectMatches = (rawUrl.match(/(redirect=|url=|dest=|target=|\/\/)/gi) || []).length;
  // Subtract 1 for the protocol '://'
  const numRedirectTokens = Math.max(0, redirectMatches - 1);

  // 18. Login / Suspicious Keywords
  let hasLoginKeyword = 0;
  const lowerUrl = rawUrl.toLowerCase();
  for (const kw of LOGIN_KEYWORDS) {
    if (lowerUrl.includes(kw)) {
      hasLoginKeyword = 1;
      break;
    }
  }

  // 19. HTTPS usage
  const isHttps = parsedUrl.protocol === 'https:' ? 1 : 0;

  // 20. DNS resolution
  const dnsResolves = extraSignals?.dnsResolves !== undefined ? (extraSignals.dnsResolves ? 1 : 0) : 1;

  // 21. Domain Entropy
  const domainEntropy = calculateEntropy(hostname);

  // 22. Password Field
  const hasPasswordField = extraSignals?.hasPasswordField ? 1 : 0;

  // 23. External Form Action
  const externalFormAction = extraSignals?.externalFormAction ? 1 : 0;

  // 24. Empty Form Action
  const emptyFormAction = extraSignals?.emptyFormAction ? 1 : 0;

  // 25. Suspicious Iframe
  const suspiciousIframe = extraSignals?.suspiciousIframe ? 1 : 0;

  // 26. Disabled Right Click
  const disabledRightClick = extraSignals?.disabledRightClick ? 1 : 0;

  // 27. Hidden Elements Count
  const hiddenElementsCount = extraSignals?.hiddenElementsCount || 0;

  const features: IUrlFeatures = {
    urlLength,
    domainLength,
    numDots,
    numSubdomains,
    numHyphens,
    numSpecialChars: specialChars,
    hasIpHost,
    hasAtSymbol,
    isShortener,
    hasSuspiciousTld,
    hasBrandInSubdomain,
    hasPunycode,
    numEncodedChars,
    pathDepth,
    queryLength,
    numQueries,
    numRedirectTokens,
    hasLoginKeyword,
    isHttps,
    dnsResolves,
    domainEntropy,
    hasPasswordField,
    externalFormAction,
    emptyFormAction,
    suspiciousIframe,
    disabledRightClick,
    hiddenElementsCount,
  };

  const vector = FEATURE_NAMES.map((key) => features[key]);

  return { features, vector };
}
