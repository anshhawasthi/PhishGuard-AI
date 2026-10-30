export interface IUrlFeatures {
  urlLength: number;
  domainLength: number;
  numDots: number;
  numSubdomains: number;
  numHyphens: number;
  numSpecialChars: number;
  hasIpHost: number; // 0 or 1
  hasAtSymbol: number; // 0 or 1
  isShortener: number; // 0 or 1
  hasSuspiciousTld: number; // 0 or 1
  hasBrandInSubdomain: number; // 0 or 1
  hasPunycode: number; // 0 or 1
  numEncodedChars: number;
  pathDepth: number;
  queryLength: number;
  numQueries: number;
  numRedirectTokens: number;
  hasLoginKeyword: number; // 0 or 1
  isHttps: number; // 0 or 1
  dnsResolves: number; // 0 or 1
  domainEntropy: number;
  hasPasswordField: number; // 0 or 1
  externalFormAction: number; // 0 or 1
  emptyFormAction: number; // 0 or 1
  suspiciousIframe: number; // 0 or 1
  disabledRightClick: number; // 0 or 1
  hiddenElementsCount: number;
}

export const FEATURE_NAMES: (keyof IUrlFeatures)[] = [
  'urlLength',
  'domainLength',
  'numDots',
  'numSubdomains',
  'numHyphens',
  'numSpecialChars',
  'hasIpHost',
  'hasAtSymbol',
  'isShortener',
  'hasSuspiciousTld',
  'hasBrandInSubdomain',
  'hasPunycode',
  'numEncodedChars',
  'pathDepth',
  'queryLength',
  'numQueries',
  'numRedirectTokens',
  'hasLoginKeyword',
  'isHttps',
  'dnsResolves',
  'domainEntropy',
  'hasPasswordField',
  'externalFormAction',
  'emptyFormAction',
  'suspiciousIframe',
  'disabledRightClick',
  'hiddenElementsCount',
];

export interface IMLModel {
  name: string;
  train(X: number[][], y: number[]): Promise<void>;
  predict(X: number[][]): number[];
  predictProbability(X: number[][]): number[];
  getFeatureImportances(): { feature: string; importance: number }[];
  toJSON(): any;
  fromJSON(data: any): void;
}

export interface IEvaluationResult {
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
