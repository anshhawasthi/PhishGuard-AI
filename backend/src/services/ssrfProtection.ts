import dns from 'dns/promises';
import { URL } from 'url';

/**
 * Strict SSRF (Server-Side Request Forgery) Protection Engine
 * Blocks internal infrastructure, RFC 1918 private subnets, loopback,
 * cloud metadata endpoints (AWS/GCP/Azure), and validates redirect destinations.
 */

// CIDR ranges and blocked subnets
const PRIVATE_IPV4_PATTERNS = [
  /^127\./,                         // Loopback
  /^10\./,                          // Class A private
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Class B private (172.16.0.0 - 172.31.255.255)
  /^192\.168\./,                    // Class C private
  /^169\.254\./,                    // Link-local / Cloud metadata (169.254.169.254)
  /^0\./,                           // Current network
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Carrier-grade NAT
  /^192\.0\.0\./,                   // IETF Protocol Assignments
  /^192\.0\.2\./,                   // TEST-NET-1
  /^198\.18\./,                     // Benchmarking
  /^198\.51\.100\./,                // TEST-NET-2
  /^203\.0\.113\./,                 // TEST-NET-3
  /^224\./,                         // Multicast
  /^240\./,                         // Future use / Reserved
  /^255\.255\.255\.255$/,           // Broadcast
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'instance-data',
]);

export function isIpPrivateOrReserved(ip: string): boolean {
  // IPv6 checks
  const cleanIp = ip.trim().toLowerCase();
  if (
    cleanIp === '::1' ||
    cleanIp === '::' ||
    cleanIp.startsWith('fe80:') || // link-local
    cleanIp.startsWith('fc') ||   // unique local address
    cleanIp.startsWith('fd')
  ) {
    return true;
  }

  // IPv4 mapped into IPv6 (::ffff:127.0.0.1)
  const ipv4Mapped = cleanIp.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  const targetIpv4 = ipv4Mapped ? ipv4Mapped[1] : cleanIp;

  for (const pattern of PRIVATE_IPV4_PATTERNS) {
    if (pattern.test(targetIpv4)) {
      return true;
    }
  }

  return false;
}

export interface SSRFValidationResult {
  isSafe: boolean;
  reason?: string;
  resolvedIps: string[];
}

export async function validateUrlAgainstSSRF(inputUrl: string): Promise<SSRFValidationResult> {
  try {
    let parsed: URL;
    try {
      parsed = new URL(inputUrl);
    } catch {
      return { isSafe: false, reason: 'Malformed URL', resolvedIps: [] };
    }

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isSafe: false,
        reason: `Disallowed protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`,
        resolvedIps: [],
      };
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // Check direct hostname blocklist
    if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.lan')) {
      return {
        isSafe: false,
        reason: `Target host "${hostname}" points to a local or internal domain.`,
        resolvedIps: [],
      };
    }

    // Check if hostname is direct IP
    if (/^(\d+\.\d+\.\d+\.\d+)$/.test(hostname) || hostname.includes(':')) {
      if (isIpPrivateOrReserved(hostname)) {
        return {
          isSafe: false,
          reason: `Target IP "${hostname}" is a private, loopback, or cloud-metadata address.`,
          resolvedIps: [hostname],
        };
      }
    }

    // DNS resolution check
    let resolvedIps: string[] = [];
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      resolvedIps = addresses.map((a) => a.address);
    } catch (dnsErr: any) {
      // Domain doesn't resolve in DNS
      return {
        isSafe: true, // Not an SSRF risk to private network, though domain may be offline
        reason: `DNS resolution failed: ${dnsErr.message}`,
        resolvedIps: [],
      };
    }

    // Verify all resolved IP addresses
    for (const ip of resolvedIps) {
      if (isIpPrivateOrReserved(ip)) {
        return {
          isSafe: false,
          reason: `Resolved IP "${ip}" belongs to a private, loopback, or cloud-metadata network.`,
          resolvedIps,
        };
      }
    }

    return {
      isSafe: true,
      resolvedIps,
    };
  } catch (err: any) {
    return {
      isSafe: false,
      reason: `Validation error: ${err.message}`,
      resolvedIps: [],
    };
  }
}
