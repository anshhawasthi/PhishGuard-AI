import dns from 'dns/promises';
import tls from 'tls';
import { parse } from 'tldts';
import { calculateEntropy, SUSPICIOUS_TLDS, SHORTENER_DOMAINS } from '../ml/featureExtractor';

export interface IDomainAnalysis {
  domain: string;
  subdomain: string;
  tld: string;
  ip_addresses: string[];
  dns_resolves: boolean;
  domain_age_days?: number;
  registrar?: string;
  is_shortener: boolean;
  is_suspicious_tld: boolean;
  entropy: number;
}

export interface ISslAnalysis {
  has_https: boolean;
  is_valid?: boolean;
  issuer?: string;
  valid_from?: string;
  valid_to?: string;
  days_until_expiry?: number;
}

export async function analyzeDomain(hostname: string): Promise<IDomainAnalysis> {
  const parsed = parse(hostname);
  const domain = parsed.domain || hostname;
  const subdomain = parsed.subdomain || '';
  const tld = parsed.publicSuffix || '';
  const entropy = calculateEntropy(hostname);
  const is_shortener = SHORTENER_DOMAINS.has(hostname.toLowerCase());
  const is_suspicious_tld = SUSPICIOUS_TLDS.has(tld.toLowerCase());

  let ip_addresses: string[] = [];
  let dns_resolves = false;

  try {
    const records = await dns.lookup(hostname, { all: true });
    ip_addresses = records.map((r) => r.address);
    dns_resolves = ip_addresses.length > 0;
  } catch {
    dns_resolves = false;
  }

  return {
    domain,
    subdomain,
    tld,
    ip_addresses,
    dns_resolves,
    is_shortener,
    is_suspicious_tld,
    entropy,
  };
}

export async function analyzeSsl(hostname: string, isHttps: boolean): Promise<ISslAnalysis> {
  if (!isHttps) {
    return { has_https: false, is_valid: false };
  }

  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
        timeout: 3000,
        rejectUnauthorized: false, // Inspect even self-signed certs
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;

          if (cert && cert.valid_to) {
            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysUntilExpiry = Math.max(0, Math.round((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const rawIssuer = typeof cert.issuer === 'object' ? (cert.issuer.O || cert.issuer.CN || 'Unknown') : 'Unknown';
            const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : String(rawIssuer);

            socket.destroy();
            return resolve({
              has_https: true,
              is_valid: authorized && daysUntilExpiry > 0,
              issuer,
              valid_from: cert.valid_from,
              valid_to: cert.valid_to,
              days_until_expiry: daysUntilExpiry,
            });
          }
        } catch {
          // ignore
        }
        socket.destroy();
        resolve({ has_https: true, is_valid: false });
      }
    );

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ has_https: true, is_valid: false });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ has_https: true, is_valid: false });
    });
  });
}
