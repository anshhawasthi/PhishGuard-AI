import { IEvaluationResult, IMLModel } from './types';

export function evaluateModel(
  model: IMLModel,
  testX: number[][],
  testY: number[]
): IEvaluationResult {
  const yPred = model.predict(testX);
  const yProbs = model.predictProbability(testX);

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (let i = 0; i < testY.length; i++) {
    const actual = testY[i];
    const predicted = yPred[i];

    if (actual === 1 && predicted === 1) tp++;
    else if (actual === 0 && predicted === 1) fp++;
    else if (actual === 0 && predicted === 0) tn++;
    else if (actual === 1 && predicted === 0) fn++;
  }

  const total = testY.length || 1;
  const accuracy = parseFloat(((tp + tn) / total).toFixed(4));
  const precision = parseFloat((tp + fp > 0 ? tp / (tp + fp) : 0).toFixed(4));
  const recall = parseFloat((tp + fn > 0 ? tp / (tp + fn) : 0).toFixed(4));
  const f1_score = parseFloat(
    (precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0).toFixed(4)
  );

  // Compute ROC-AUC score via trapezoidal approximation of sorted probabilities
  const pairs = testY.map((actual, idx) => ({ actual, prob: yProbs[idx] }));
  pairs.sort((a, b) => b.prob - a.prob);

  let positiveCount = testY.filter((y) => y === 1).length;
  let negativeCount = testY.filter((y) => y === 0).length;

  let auc_score = 0.5;
  if (positiveCount > 0 && negativeCount > 0) {
    let truePositives = 0;
    let falsePositives = 0;
    let lastFpr = 0;
    let lastTpr = 0;
    let area = 0;

    for (const pair of pairs) {
      if (pair.actual === 1) {
        truePositives++;
      } else {
        falsePositives++;
      }
      const tpr = truePositives / positiveCount;
      const fpr = falsePositives / negativeCount;

      // Trapezoid area: (FPR_i - FPR_{i-1}) * (TPR_i + TPR_{i-1}) / 2
      area += (fpr - lastFpr) * ((tpr + lastTpr) / 2);
      lastFpr = fpr;
      lastTpr = tpr;
    }
    auc_score = parseFloat(Math.max(0.5, Math.min(1.0, area)).toFixed(4));
  }

  const feature_importances = model.getFeatureImportances();

  return {
    accuracy,
    precision,
    recall,
    f1_score,
    auc_score,
    confusion_matrix: { tp, fp, tn, fn },
    feature_importances,
  };
}
