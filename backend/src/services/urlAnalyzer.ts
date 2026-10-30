import { URL } from 'url';
import mongoose from 'mongoose';
import { extractUrlFeatures, isLocalDevHost } from '../ml/featureExtractor';
import { ModelManager } from '../ml/modelManager';
import { analyzeDomain, analyzeSsl, IDomainAnalysis, ISslAnalysis } from './domainAnalyzer';
import { analyzeWebsiteContent, IContentAnalysis } from './contentAnalyzer';
import { computeRiskScore, IRiskScoreResult } from './riskScorer';
import { checkThreatIntelligence, IThreatIntelResult } from './threatIntel';
import { saveScanRecord } from '../database/scanStore';

export interface IAnalyzeUrlOptions {
  url: string;
  userId?: string | mongoose.Types.ObjectId | null;
  clientSource?: 'web' | 'extension' | 'bulk' | 'api';
  skipContentFetch?: boolean; // For fast bulk scans
}

export interface IAnalysisResponse {
  scanId?: string;
  original_url: string;
  normalized_url: string;
  verdict: 'safe' | 'suspicious' | 'phishing';
  risk_score: number;
  ml_prediction: 'legitimate' | 'phishing' | 'unavailable';
  ml_probability: number;
  model_version: string;
  detected_factors: any[];
  feature_contributions: any[];
  domain_analysis: IDomainAnalysis;
  ssl_analysis: ISslAnalysis;
  content_analysis: IContentAnalysis;
  threat_intel: IThreatIntelResult[];
  scan_status: 'completed' | 'partial' | 'failed';
  created_at: string;
}

export async function analyzeUrl(options: IAnalyzeUrlOptions): Promise<IAnalysisResponse> {
  let rawUrl = (options.url || '').trim();
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = 'https://' + rawUrl;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch (err: any) {
    throw new Error(`Invalid URL format: ${err.message}`);
  }

  const hostname = parsed.hostname;
  const isHttps = parsed.protocol === 'https:';
  const isLocal = isLocalDevHost(hostname);

  // 1. Domain Analysis & DNS Resolution
  const domainAnalysis = await analyzeDomain(hostname);
  if (isLocal) {
    domainAnalysis.dns_resolves = true;
    domainAnalysis.is_shortener = false;
    domainAnalysis.is_suspicious_tld = false;
  }

  // 2. SSL Analysis
  const sslAnalysis = isLocal
    ? { has_https: isHttps, is_valid: true, issuer: 'Local Development Host' }
    : await analyzeSsl(hostname, isHttps);

  // 3. Website Content Analysis (if not skipped)
  let contentAnalysis: IContentAnalysis;
  if (isLocal) {
    contentAnalysis = {
      checked: true,
      has_forms: false,
      has_password_field: false,
      external_form_action: false,
      empty_form_action: false,
      hidden_elements_count: 0,
      suspicious_iframes_count: 0,
      disabled_right_click: false,
      title: 'Localhost Development Environment',
    };
  } else if (options.skipContentFetch) {
    contentAnalysis = {
      checked: false,
      has_forms: false,
      has_password_field: false,
      external_form_action: false,
      empty_form_action: false,
      hidden_elements_count: 0,
      suspicious_iframes_count: 0,
      disabled_right_click: false,
      error_message: 'Content fetch skipped for high-speed bulk mode.',
    };
  } else {
    contentAnalysis = await analyzeWebsiteContent(rawUrl);
  }

  // 4. Feature Extraction
  const { vector } = extractUrlFeatures(rawUrl, {
    dnsResolves: domainAnalysis.dns_resolves,
    hasPasswordField: contentAnalysis.has_password_field,
    externalFormAction: contentAnalysis.external_form_action,
    emptyFormAction: contentAnalysis.empty_form_action,
    suspiciousIframe: contentAnalysis.suspicious_iframes_count > 0,
    disabledRightClick: contentAnalysis.disabled_right_click,
    hiddenElementsCount: contentAnalysis.hidden_elements_count,
  });

  // 5. Machine Learning Prediction
  const modelManager = ModelManager.getInstance();
  const mlResult = isLocal
    ? {
        prediction: 'legitimate' as const,
        probability: 0.0,
        modelVersion: modelManager.getActiveModelName(),
        featureContributions: [],
      }
    : modelManager.predict(vector);

  // 6. Threat Intelligence Lookup
  const threatIntel = isLocal ? [] : await checkThreatIntelligence(rawUrl);

  // 7. Explainable Risk Scoring
  const riskResult = computeRiskScore(
    rawUrl,
    extractUrlFeatures(rawUrl).features,
    domainAnalysis,
    sslAnalysis,
    contentAnalysis,
    mlResult.probability
  );

  const scanStatus: 'completed' | 'partial' | 'failed' = contentAnalysis.checked
    ? 'completed'
    : 'partial';

  const createdAt = new Date();

  // 8. Persist scan history to MongoDB / persistent store
  let savedScanId: string | undefined = undefined;
  try {
    savedScanId = await saveScanRecord({
      user_id: options.userId || null,
      original_url: rawUrl,
      normalized_url: parsed.href,
      verdict: riskResult.verdict,
      risk_score: riskResult.riskScore,
      ml_prediction: mlResult.prediction,
      ml_probability: mlResult.probability,
      model_version: mlResult.modelVersion,
      detected_factors: riskResult.detectedFactors,
      domain_analysis: domainAnalysis,
      ssl_analysis: sslAnalysis,
      content_analysis: contentAnalysis,
      scan_status: scanStatus,
      client_source: options.clientSource || 'web',
      created_at: createdAt,
    });
  } catch (saveErr: any) {
    console.warn(`[UrlAnalyzer] Could not save scan: ${saveErr.message}`);
  }

  return {
    scanId: savedScanId,
    original_url: rawUrl,
    normalized_url: parsed.href,
    verdict: riskResult.verdict,
    risk_score: riskResult.riskScore,
    ml_prediction: mlResult.prediction,
    ml_probability: mlResult.probability,
    model_version: mlResult.modelVersion,
    detected_factors: riskResult.detectedFactors,
    feature_contributions: mlResult.featureContributions,
    domain_analysis: domainAnalysis,
    ssl_analysis: sslAnalysis,
    content_analysis: contentAnalysis,
    threat_intel: threatIntel,
    scan_status: scanStatus,
    created_at: createdAt.toISOString(),
  };
}
