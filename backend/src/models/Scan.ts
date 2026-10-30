import mongoose, { Document, Schema } from 'mongoose';

export interface IDetectedFactor {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
}

export interface IScan extends Document {
  user_id?: mongoose.Types.ObjectId | null;
  original_url: string;
  normalized_url: string;
  verdict: 'safe' | 'suspicious' | 'phishing';
  risk_score: number; // 0 to 100
  ml_prediction: 'legitimate' | 'phishing' | 'unavailable';
  ml_probability: number; // 0.0 to 1.0
  model_version: string;
  detected_factors: IDetectedFactor[];
  domain_analysis: {
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
  };
  ssl_analysis: {
    has_https: boolean;
    is_valid?: boolean;
    issuer?: string;
    valid_from?: string;
    valid_to?: string;
    days_until_expiry?: number;
  };
  content_analysis: {
    checked: boolean;
    has_forms: boolean;
    has_password_field: boolean;
    external_form_action: boolean;
    hidden_elements_count: number;
    suspicious_iframes_count: number;
    disabled_right_click: boolean;
    title?: string;
    status_code?: number;
    error_message?: string;
  };
  scan_status: 'completed' | 'partial' | 'failed';
  client_source: 'web' | 'extension' | 'bulk' | 'api';
  created_at: Date;
}

const ScanSchema = new Schema<IScan>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    original_url: { type: String, required: true, index: true },
    normalized_url: { type: String, required: true, index: true },
    verdict: { type: String, enum: ['safe', 'suspicious', 'phishing'], required: true, index: true },
    risk_score: { type: Number, required: true, min: 0, max: 100, index: true },
    ml_prediction: { type: String, enum: ['legitimate', 'phishing', 'unavailable'], required: true },
    ml_probability: { type: Number, required: true, min: 0, max: 1 },
    model_version: { type: String, default: 'Heuristic-v1.0' },
    detected_factors: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
        description: { type: String, required: true },
        evidence: { type: String, required: true },
      },
    ],
    domain_analysis: {
      domain: { type: String, default: '' },
      subdomain: { type: String, default: '' },
      tld: { type: String, default: '' },
      ip_addresses: [{ type: String }],
      dns_resolves: { type: Boolean, default: false },
      domain_age_days: { type: Number },
      registrar: { type: String },
      is_shortener: { type: Boolean, default: false },
      is_suspicious_tld: { type: Boolean, default: false },
      entropy: { type: Number, default: 0 },
    },
    ssl_analysis: {
      has_https: { type: Boolean, default: false },
      is_valid: { type: Boolean },
      issuer: { type: String },
      valid_from: { type: String },
      valid_to: { type: String },
      days_until_expiry: { type: Number },
    },
    content_analysis: {
      checked: { type: Boolean, default: false },
      has_forms: { type: Boolean, default: false },
      has_password_field: { type: Boolean, default: false },
      external_form_action: { type: Boolean, default: false },
      hidden_elements_count: { type: Number, default: 0 },
      suspicious_iframes_count: { type: Number, default: 0 },
      disabled_right_click: { type: Boolean, default: false },
      title: { type: String },
      status_code: { type: Number },
      error_message: { type: String },
    },
    scan_status: { type: String, enum: ['completed', 'partial', 'failed'], default: 'completed' },
    client_source: { type: String, enum: ['web', 'extension', 'bulk', 'api'], default: 'web' },
    created_at: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const Scan = mongoose.model<IScan>('Scan', ScanSchema);
