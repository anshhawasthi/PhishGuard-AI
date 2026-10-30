import { validateUrlAgainstSSRF, isIpPrivateOrReserved } from '../services/ssrfProtection';
import { extractUrlFeatures, calculateEntropy } from '../ml/featureExtractor';
import { LogisticRegressionModel } from '../ml/logisticRegression';
import { DecisionTreeModel } from '../ml/decisionTree';
import { RandomForestModel } from '../ml/randomForest';
import { GradientBoostingModel } from '../ml/gradientBoosting';
import { StandardScaler } from '../ml/scaler';
import { evaluateModel } from '../ml/evaluator';
import { PRELOADED_SAMPLES } from '../ml/preloadedDataset';
import { computeRiskScore } from '../services/riskScorer';
import { generatePdfReport } from '../services/pdfService';

async function runTests() {
  console.log('====================================================');
  console.log('       PhishGuard AI – Automated Test Suite         ');
  console.log('====================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. SSRF Protection Tests
  console.log('\n--- 1. Testing SSRF Protection ---');
  assert(isIpPrivateOrReserved('127.0.0.1'), 'Blocks 127.0.0.1 IPv4 loopback');
  assert(isIpPrivateOrReserved('10.0.0.1'), 'Blocks 10.0.0.1 private Class A');
  assert(isIpPrivateOrReserved('172.16.5.1'), 'Blocks 172.16.5.1 private Class B');
  assert(isIpPrivateOrReserved('192.168.1.1'), 'Blocks 192.168.1.1 private Class C');
  assert(isIpPrivateOrReserved('169.254.169.254'), 'Blocks AWS/GCP/Azure Cloud Metadata IP');
  assert(isIpPrivateOrReserved('::1'), 'Blocks IPv6 loopback');
  assert(!isIpPrivateOrReserved('8.8.8.8'), 'Allows public IP 8.8.8.8');
  assert(!isIpPrivateOrReserved('142.250.190.46'), 'Allows public IP (Google)');

  const ssrfLocalhost = await validateUrlAgainstSSRF('http://localhost:8080/admin');
  assert(!ssrfLocalhost.isSafe, 'Blocks localhost URL');

  const ssrfMetadata = await validateUrlAgainstSSRF('http://169.254.169.254/latest/meta-data/');
  assert(!ssrfMetadata.isSafe, 'Blocks cloud metadata URL');

  // 2. Feature Extraction Tests
  console.log('\n--- 2. Testing Feature Extraction Engine ---');
  const benignUrl = 'https://www.google.com/search?q=machine+learning';
  const benignFeatures = extractUrlFeatures(benignUrl);
  assert(benignFeatures.features.isHttps === 1, 'Detects HTTPS correctly');
  assert(benignFeatures.features.hasIpHost === 0, 'Detects benign domain is not raw IP');
  assert(benignFeatures.features.hasSuspiciousTld === 0, 'Detects .com is not suspicious TLD');

  const phishUrl = 'http://192.168.1.100/paypal.com-verify/login.php?dest=https://evil.tk';
  const phishFeatures = extractUrlFeatures(phishUrl);
  assert(phishFeatures.features.hasIpHost === 1, 'Detects raw IP host correctly');
  assert(phishFeatures.features.hasBrandInSubdomain === 1, 'Detects brand impersonation in path/subdomain');
  assert(phishFeatures.features.hasLoginKeyword === 1, 'Detects login keyword in URL');

  const punyUrl = 'http://xn--gogle-qqa.com/auth';
  const punyFeatures = extractUrlFeatures(punyUrl);
  assert(punyFeatures.features.hasPunycode === 1, 'Detects punycode homograph attack');

  const entropy = calculateEntropy('abcdefghijklmnopqrstuvwxyz0123456789');
  assert(entropy > 4.5, 'Calculates high Shannon entropy for random strings');

  // 3. Machine Learning Models Tests (Stratified Train/Test Split)
  console.log('\n--- 3. Testing Machine Learning Algorithms ---');
  const posSamples = PRELOADED_SAMPLES.filter((s) => s.label === 1);
  const negSamples = PRELOADED_SAMPLES.filter((s) => s.label === 0);

  const trainSamples = [
    ...posSamples.slice(0, Math.floor(posSamples.length * 0.8)),
    ...negSamples.slice(0, Math.floor(negSamples.length * 0.8)),
  ];
  const testSamples = [
    ...posSamples.slice(Math.floor(posSamples.length * 0.8)),
    ...negSamples.slice(Math.floor(negSamples.length * 0.8)),
  ];

  const trainX = trainSamples.map((s) => extractUrlFeatures(s.url).vector);
  const trainY = trainSamples.map((s) => s.label);
  const testX = testSamples.map((s) => extractUrlFeatures(s.url).vector);
  const testY = testSamples.map((s) => s.label);

  const scaler = new StandardScaler();
  const scaledTrainX = scaler.fitTransform(trainX);
  const scaledTestX = scaler.transform(testX);

  // Model 1: Logistic Regression
  const lr = new LogisticRegressionModel(0.1, 300);
  await lr.train(scaledTrainX, trainY);
  const lrEval = evaluateModel(lr, scaledTestX, testY);
  assert(lrEval.accuracy >= 0.7, `Logistic Regression Accuracy >= 70% (Actual: ${(lrEval.accuracy * 100).toFixed(1)}%)`);

  // Model 2: Decision Tree
  const dt = new DecisionTreeModel(5, 4);
  await dt.train(trainX, trainY);
  const dtEval = evaluateModel(dt, testX, testY);
  assert(dtEval.accuracy >= 0.75, `Decision Tree Accuracy >= 75% (Actual: ${(dtEval.accuracy * 100).toFixed(1)}%)`);

  // Model 3: Random Forest
  const rf = new RandomForestModel(15, 6, 3);
  await rf.train(trainX, trainY);
  const rfEval = evaluateModel(rf, testX, testY);
  assert(rfEval.accuracy >= 0.8, `Random Forest Accuracy >= 80% (Actual: ${(rfEval.accuracy * 100).toFixed(1)}%)`);

  // Model 4: Gradient Boosted Trees
  const gb = new GradientBoostingModel(20, 0.2, 4);
  await gb.train(trainX, trainY);
  const gbEval = evaluateModel(gb, testX, testY);
  assert(gbEval.accuracy >= 0.8, `Gradient Boosted Trees Accuracy >= 80% (Actual: ${(gbEval.accuracy * 100).toFixed(1)}%)`);
  assert(gbEval.auc_score >= 0.8, `Gradient Boosted Trees AUC >= 0.8 (Actual: ${gbEval.auc_score})`);

  // 4. Risk Scorer Tests
  console.log('\n--- 4. Testing Risk Scorer & Explainable Factors ---');
  const riskPhish = computeRiskScore(
    phishUrl,
    phishFeatures.features,
    { domain: '192.168.1.100', subdomain: '', tld: '', ip_addresses: ['192.168.1.100'], dns_resolves: true, is_shortener: false, is_suspicious_tld: false, entropy: 2.1 },
    { has_https: false },
    { checked: true, has_forms: true, has_password_field: true, external_form_action: true, empty_form_action: false, hidden_elements_count: 5, suspicious_iframes_count: 1, disabled_right_click: true },
    0.95
  );
  assert(riskPhish.verdict === 'phishing', `Correctly classifies phishing attack (Score: ${riskPhish.riskScore})`);
  assert(riskPhish.detectedFactors.length >= 3, `Extracts ${riskPhish.detectedFactors.length} risk indicators with evidence`);

  // 5. PDF Report Generation Test
  console.log('\n--- 5. Testing PDF Report Generation ---');
  const dummyScan: any = {
    scanId: 'TEST-SCAN-1234',
    original_url: phishUrl,
    normalized_url: phishUrl,
    verdict: 'phishing',
    risk_score: 92,
    ml_prediction: 'phishing',
    ml_probability: 0.96,
    model_version: 'Gradient Boosted Trees',
    detected_factors: riskPhish.detectedFactors,
    domain_analysis: { domain: '192.168.1.100', subdomain: '', tld: '', ip_addresses: ['192.168.1.100'], dns_resolves: true, is_suspicious_tld: false },
    ssl_analysis: { has_https: false, is_valid: false },
    content_analysis: { has_password_field: true, external_form_action: true },
    created_at: new Date().toISOString(),
  };

  const pdfBuf = await generatePdfReport(dummyScan);
  assert(pdfBuf && pdfBuf.length > 1000, `Generates valid PDF buffer (${pdfBuf.length} bytes)`);

  console.log('\n====================================================');
  console.log(`  Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
