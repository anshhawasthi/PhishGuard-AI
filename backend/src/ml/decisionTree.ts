import { IMLModel, FEATURE_NAMES } from './types';

interface TreeNode {
  isLeaf: boolean;
  prediction?: number;
  probability?: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  gain?: number;
}

export class DecisionTreeModel implements IMLModel {
  name = 'Decision Tree';
  maxDepth: number;
  minSamplesSplit: number;
  root: TreeNode | null = null;
  featureImportancesMap: number[] = [];

  constructor(maxDepth = 6, minSamplesSplit = 4) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  private gini(y: number[]): number {
    if (y.length === 0) return 0;
    const p1 = y.reduce((sum, val) => sum + val, 0) / y.length;
    const p0 = 1 - p1;
    return 1 - (p0 * p0 + p1 * p1);
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const numSamples = X.length;
    const numPositive = y.reduce((sum, val) => sum + val, 0);
    const prob = numSamples > 0 ? numPositive / numSamples : 0;
    const currentPrediction = prob >= 0.5 ? 1 : 0;

    // Base cases
    if (depth >= this.maxDepth || numSamples < this.minSamplesSplit || prob === 0 || prob === 1) {
      return { isLeaf: true, prediction: currentPrediction, probability: prob };
    }

    const currentGini = this.gini(y);
    let bestGain = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIndices: number[] = [];
    let bestRightIndices: number[] = [];

    const numFeatures = X[0].length;
    for (let f = 0; f < numFeatures; f++) {
      // Find candidate split points
      const values = X.map((row) => row[f]);
      const uniqueVals = Array.from(new Set(values)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;

      // Sample a subset of split thresholds for efficiency
      const thresholds: number[] = [];
      const step = Math.max(1, Math.floor(uniqueVals.length / 10));
      for (let i = 0; i < uniqueVals.length - 1; i += step) {
        thresholds.push((uniqueVals[i] + uniqueVals[i + 1]) / 2);
      }

      for (const th of thresholds) {
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let i = 0; i < numSamples; i++) {
          if (X[i][f] <= th) leftIdx.push(i);
          else rightIdx.push(i);
        }

        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        const leftY = leftIdx.map((i) => y[i]);
        const rightY = rightIdx.map((i) => y[i]);
        const leftGini = this.gini(leftY);
        const rightGini = this.gini(rightY);
        const weightedGini = (leftIdx.length / numSamples) * leftGini + (rightIdx.length / numSamples) * rightGini;
        const gain = currentGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = th;
          bestLeftIndices = leftIdx;
          bestRightIndices = rightIdx;
        }
      }
    }

    if (bestGain <= 0 || bestFeature === -1) {
      return { isLeaf: true, prediction: currentPrediction, probability: prob };
    }

    // Accumulate feature importance
    if (this.featureImportancesMap[bestFeature] !== undefined) {
      this.featureImportancesMap[bestFeature] += bestGain * (numSamples / (this.root ? 100 : numSamples));
    }

    const leftX = bestLeftIndices.map((i) => X[i]);
    const leftY = bestLeftIndices.map((i) => y[i]);
    const rightX = bestRightIndices.map((i) => X[i]);
    const rightY = bestRightIndices.map((i) => y[i]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      gain: bestGain,
      left: this.buildTree(leftX, leftY, depth + 1),
      right: this.buildTree(rightX, rightY, depth + 1),
      probability: prob,
      prediction: currentPrediction,
    };
  }

  async train(X: number[][], y: number[]): Promise<void> {
    const numFeatures = X[0].length;
    this.featureImportancesMap = new Array(numFeatures).fill(0);
    this.root = this.buildTree(X, y, 0);
  }

  private predictSample(node: TreeNode, x: number[]): { prediction: number; probability: number } {
    if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
      return { prediction: node.prediction ?? 0, probability: node.probability ?? 0 };
    }
    if (x[node.featureIndex] <= node.threshold) {
      return this.predictSample(node.left!, x);
    } else {
      return this.predictSample(node.right!, x);
    }
  }

  predictProbability(X: number[][]): number[] {
    if (!this.root) return X.map(() => 0.5);
    return X.map((row) => parseFloat(this.predictSample(this.root!, row).probability.toFixed(4)));
  }

  predict(X: number[][]): number[] {
    if (!this.root) return X.map(() => 0);
    return X.map((row) => this.predictSample(this.root!, row).prediction);
  }

  getFeatureImportances(): { feature: string; importance: number }[] {
    const total = this.featureImportancesMap.reduce((s, v) => s + v, 0) || 1;
    return this.featureImportancesMap.map((val, i) => ({
      feature: FEATURE_NAMES[i] || `Feature ${i}`,
      importance: parseFloat((val / total).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }

  toJSON() {
    return {
      name: this.name,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      root: this.root,
      featureImportancesMap: this.featureImportancesMap,
    };
  }

  fromJSON(data: any) {
    this.name = data.name || this.name;
    this.maxDepth = data.maxDepth || 6;
    this.minSamplesSplit = data.minSamplesSplit || 4;
    this.root = data.root || null;
    this.featureImportancesMap = data.featureImportancesMap || [];
  }
}
