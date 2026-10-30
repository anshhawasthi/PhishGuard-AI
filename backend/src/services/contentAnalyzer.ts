import axios from 'axios';
import * as cheerio from 'cheerio';
import { parse } from 'tldts';
import { validateUrlAgainstSSRF } from './ssrfProtection';

export interface IContentAnalysis {
  checked: boolean;
  has_forms: boolean;
  has_password_field: boolean;
  external_form_action: boolean;
  empty_form_action: boolean;
  hidden_elements_count: number;
  suspicious_iframes_count: number;
  disabled_right_click: boolean;
  title?: string;
  status_code?: number;
  error_message?: string;
}

export async function analyzeWebsiteContent(targetUrl: string): Promise<IContentAnalysis> {
  const result: IContentAnalysis = {
    checked: false,
    has_forms: false,
    has_password_field: false,
    external_form_action: false,
    empty_form_action: false,
    hidden_elements_count: 0,
    suspicious_iframes_count: 0,
    disabled_right_click: false,
  };

  // SSRF pre-check
  const ssrfCheck = await validateUrlAgainstSSRF(targetUrl);
  if (!ssrfCheck.isSafe) {
    result.error_message = `Blocked by SSRF Protection: ${ssrfCheck.reason}`;
    return result;
  }

  try {
    let currentUrl = targetUrl;
    const response = await axios.get(targetUrl, {
      timeout: 4000,
      maxContentLength: 2 * 1024 * 1024, // 2MB limit
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 (PhishGuard-Security-Scanner/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Track and validate redirects
      maxRedirects: 3,
      beforeRedirect: async (options, responseDetails) => {
        const nextUrl = responseDetails.headers?.location;
        if (nextUrl) {
          const redirectSsrf = await validateUrlAgainstSSRF(nextUrl);
          if (!redirectSsrf.isSafe) {
            throw new Error(`SSRF blocked redirect target: ${nextUrl}`);
          }
        }
      },
      validateStatus: () => true, // capture 4xx / 5xx responses too
    });

    result.status_code = response.status;
    result.checked = true;

    const html = typeof response.data === 'string' ? response.data : '';
    if (!html) {
      return result;
    }

    const $ = cheerio.load(html);
    result.title = $('title').first().text().trim().slice(0, 150);

    // Form and password inspection
    const forms = $('form');
    result.has_forms = forms.length > 0;

    const passwordInputs = $('input[type="password"]');
    result.has_password_field = passwordInputs.length > 0;

    // Check form actions
    const parsedTargetDomain = parse(targetUrl).domain;
    forms.each((_, form) => {
      const action = ($(form).attr('action') || '').trim();
      if (!action || action === '#' || action === 'about:blank' || action.startsWith('javascript:')) {
        result.empty_form_action = true;
      } else if (action.startsWith('http://') || action.startsWith('https://')) {
        const parsedActionDomain = parse(action).domain;
        if (parsedActionDomain && parsedTargetDomain && parsedActionDomain !== parsedTargetDomain) {
          result.external_form_action = true;
        }
      }
    });

    // Hidden elements
    const hiddenInputs = $('input[type="hidden"], [style*="display: none"], [style*="display:none"], [style*="visibility: hidden"]');
    result.hidden_elements_count = hiddenInputs.length;

    // Suspicious iframes
    const iframes = $('iframe');
    iframes.each((_, iframe) => {
      const style = $(iframe).attr('style') || '';
      const width = $(iframe).attr('width');
      const height = $(iframe).attr('height');
      if (
        style.includes('display: none') ||
        style.includes('visibility: hidden') ||
        width === '0' ||
        height === '0' ||
        width === '1' ||
        height === '1'
      ) {
        result.suspicious_iframes_count++;
      }
    });

    // Disabled right click detection
    const bodyHtml = $('body').html() || '';
    if (
      bodyHtml.includes('contextmenu') ||
      bodyHtml.includes('preventDefault()') ||
      $('body').attr('oncontextmenu') !== undefined
    ) {
      result.disabled_right_click = true;
    }

    return result;
  } catch (err: any) {
    result.checked = false;
    result.error_message = `Website content unreachable (${err.message}). Partial heuristic analysis applied.`;
    return result;
  }
}
