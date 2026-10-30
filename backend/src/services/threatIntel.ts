import axios from 'axios';
import { config } from '../config';

export interface IThreatIntelResult {
  source: string;
  isFlagged: boolean;
  threatType?: string;
  details?: string;
}

export async function checkThreatIntelligence(targetUrl: string): Promise<IThreatIntelResult[]> {
  const results: IThreatIntelResult[] = [];

  // Google Safe Browsing API (v4)
  if (config.googleSafeBrowsingKey) {
    try {
      const gsbEndpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${config.googleSafeBrowsingKey}`;
      const payload = {
        client: { clientId: 'phishguard-ai', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url: targetUrl }],
        },
      };
      const resp = await axios.post(gsbEndpoint, payload, { timeout: 3000 });
      if (resp.data && resp.data.matches && resp.data.matches.length > 0) {
        results.push({
          source: 'Google Safe Browsing',
          isFlagged: true,
          threatType: resp.data.matches[0].threatType,
          details: 'Flagged as malicious threat by Google Safe Browsing telemetry.',
        });
      } else {
        results.push({
          source: 'Google Safe Browsing',
          isFlagged: false,
          details: 'Clean - No threat matches found in database.',
        });
      }
    } catch (err: any) {
      results.push({
        source: 'Google Safe Browsing',
        isFlagged: false,
        details: `Check skipped: ${err.message}`,
      });
    }
  }

  return results;
}
