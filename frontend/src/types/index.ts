export interface IUser {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  is_active?: boolean;
  created_at?: string;
}

export interface IDetectedFactor {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
}

export interface IFeatureContribution {
  feature: string;
  impact: number;
}

export interface IDomainAnalysis {
  domain: string;
  subdomain: string;
  tld: string;
  ip_addresses: string[];
  dns_resolves: boolean;
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

export interface IScanResult {
  _id?: string;
  scanId?: string;
  original_url: string;
  normalized_url: string;
  verdict: 'safe' | 'suspicious' | 'phishing';
  risk_score: number;
  ml_prediction: 'legitimate' | 'phishing' | 'unavailable';
  ml_probability: number;
  model_version: string;
  detected_factors: IDetectedFactor[];
  feature_contributions?: IFeatureContribution[];
  domain_analysis?: IDomainAnalysis;
  ssl_analysis?: ISslAnalysis;
  content_analysis?: IContentAnalysis;
  threat_intel?: any[];
  scan_status?: 'completed' | 'partial' | 'failed';
  client_source?: string;
  created_at: string;
}

export interface IModelPerformance {
  model_name: string;
  version?: string;
  isActive?: boolean;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_score: number;
  confusion_matrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  feature_importances: { feature: string; importance: number }[];
}

export interface IDashboardStats {
  total_scans: number;
  safe_scans: number;
  suspicious_scans: number;
  phishing_scans: number;
  total_users: number;
  threat_distribution: { name: string; value: number; color: string }[];
  daily_activity: { date: string; scans: number; phishing: number }[];
  database_connected: boolean;
}
