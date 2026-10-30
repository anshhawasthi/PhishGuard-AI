import { IMLModel, FEATURE_NAMES } from './types';

interface RegressionNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  threshold?: number;
  left?: RegressionNode;
  right?: RegressionNode;
}

class RegressionTree {
  maxDepth: number;
  root: RegressionNode | null = null;
  featureImportances: number[] = [];

  constructor(maxDepth = 3) {
    this.maxDepth = maxDepth;
  }

  private variance(y: number[]): number {
    if (y.length === 0) return 0;
    const mean = y.reduce((s, v) => s + v, 0) / y.length;
    return y.reduce((s, v) => s + (v - mean) * (v - mean), 0) / y.length;
  }

  buildTree(X: number[][], residuals: number[], depth: number): RegressionNode {
    const numSamples = X.length;
    const meanResidual = numSamples > 0 ? residuals.reduce((s, v) => s + v, 0) / numSamples : 0;

    if (depth >= this.maxDepth || numSamples <= 5) {
      return { isLeaf: true, value: meanResidual };
    }

    const currentVar = this.variance(residuals);
    let bestGain = -1;
    let bestFeature = -1;
    let bestThreshold = 0;
    let bestLeftIdx: number[] = [];
    let bestRightIdx: number[] = [];

    const numFeatures = X[0].length;
    for (let f = 0; f < numFeatures; f++) {
      const values = X.map((r) => r[f]);
      const uniqueVals = Array.from(new Set(values)).sort((a, b) => a - b);
      if (uniqueVals.length <= 1) continue;

      const step = Math.max(1, Math.floor(uniqueVals.length / 8));
      for (let i = 0; i < uniqueVals.length - 1; i += step) {
        const th = (uniqueVals[i] + uniqueVals[i + 1]) / 2;
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];

        for (let j = 0; j < numSamples; j++) {
          if (X[j][f] <= th) leftIdx.push(j);
          else rightIdx.push(j);
        }

        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        const leftRes = leftIdx.map((j) => residuals[j]);
        const rightRes = rightIdx.map((j) => residuals[j]);
        const leftVar = this.variance(leftRes);
        const rightVar = this.variance(rightRes);
        const weightedVar = (leftIdx.length / numSamples) * leftVar + (rightIdx.length / numSamples) * rightVar;
        const gain = currentVar - weightedVar;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = f;
          bestThreshold = th;
          bestLeftIdx = leftIdx;
          bestRightIdx = rightIdx;
        }
      }
    }

    if (bestGain <= 0 || bestFeature === -1) {
      return { isLeaf: true, value: meanResidual };
    }

    if (this.featureImportances[bestFeature] !== undefined) {
      this.featureImportances[bestFeature] += bestGain;
    }

    const leftX = bestLeftIdx.map((i) => X[i]);
    const leftRes = bestLeftIdx.map((i) => residuals[i]);
    const rightX = bestRightIdx.map((i) => X[i]);
    const rightRes = bestRightIdx.map((i) => residuals[i]);

    return {
      isLeaf: false,
      featureIndex: bestFeature,
      threshold: bestThreshold,
      left: this.buildTree(leftX, leftRes, depth + 1),
      right: this.buildTree(rightX, rightRes, depth + 1),
      value: meanResidual,
    };
  }

  predictSample(node: RegressionNode, x: number[]): number {
    if (node.isLeaf || node.featureIndex === undefined || node.threshold === undefined) {
      return node.value ?? 0;
    }
    if (x[node.featureIndex] <= node.threshold) {
      return this.predictSample(node.left!, x);
    } else {
      return this.predictSample(node.right!, x);
    }
  }

  toJSON() {
    return { maxDepth: this.maxDepth, root: this.root, featureImportances: this.featureImportances };
  }

  fromJSON(data: any) {
    this.maxDepth = data.maxDepth || 3;
    this.root = data.root || null;
    this.featureImportances = data.featureImportances || [];
  }
}

export class GradientBoostingModel implements IMLModel {
  name = 'Gradient Boosted Trees';
  numEstimators: number;
  learningRate: number;
  maxDepth: number;
  baseLogOdds: number = 0;
  trees: RegressionTree[] = [];
  featureImportances: { feature: string; importance: number }[] = [];

  constructor(numEstimators = 25, learningRate = 0.15, maxDepth = 4) {
    this.numEstimators = numEstimators;
    this.learningRate = learningRate;
    this.maxDepth = maxDepth;
  }

  private sigmoid(z: number): number {
    if (z > 20) return 1;
    if (z < -20) return 0;
    return 1 / (1 + Math.exp(-z));
  }

  async train(X: number[][], y: number[]): Promise<void> {
    const numSamples = X.length;
    const numFeatures = X[0].length;
    const p1 = Math.max(0.01, Math.min(0.99, y.reduce((s, v) => s + v, 0) / numSamples));
    this.baseLogOdds = Math.log(p1 / (1 - p1));

    let currentLogOdds = new Array(numSamples).fill(this.baseLogOdds);
    this.trees = [];
    const aggregatedImportances = new Array(numFeatures).fill(0);

    for (let iter = 0; iter < this.numEstimators; iter++) {
      // Calculate pseudo-residuals: r_i = y_i - p_i
      const probabilities = currentLogOdds.map((lo) => this.sigmoid(lo));
      const residuals = y.map((yi, idx) => yi - probabilities[idx]);

      const tree = new RegressionTree(this.maxDepth);
      tree.featureImportances = new Array(numFeatures).fill(0);
      tree.root = tree.buildTree(X, residuals, 0);
      this.trees.push(tree);

      // Update current log-odds with shrinkage
      for (let i = 0; i < numSamples; i++) {
        const update = tree.predictSample(tree.root!, X[i]);
        currentLogOdds[i] += this.learningRate * update;
      }

      for (let f = 0; f < numFeatures; f++) {
        aggregatedImportances[f] += tree.featureImportances[f] || 0;
      }
    }

    const total = aggregatedImportances.reduce((s, v) => s + v, 0) || 1;
    this.featureImportances = aggregatedImportances.map((val, i) => ({
      feature: FEATURE_NAMES[i] || `Feature ${i}`,
      importance: parseFloat((val / total).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }

  predictProbability(X: number[][]): number[] {
    return X.map((row) => {
      let logOdds = this.baseLogOdds;
      for (const tree of this.trees) {
        if (tree.root) {
          logOdds += this.learningRate * tree.predictSample(tree.root, row);
        }
      }
      return parseFloat(this.sigmoid(logOdds).toFixed(4));
    });
  }

  predict(X: number[][]): number[] {
    return this.predictProbability(X).map((p) => (p >= 0.5 ? 1 : 0));
  }

  getFeatureImportances(): { feature: string; importance: number }[] {
    return this.featureImportances;
  }

  toJSON() {
    return {
      name: this.name,
      numEstimators: this.numEstimators,
      learningRate: this.learningRate,
      maxDepth: this.maxDepth,
      baseLogOdds: this.baseLogOdds,
      trees: this.trees.map((t) => t.toJSON()),
      featureImportances: this.featureImportances,
    };
  }

  fromJSON(data: any) {
    this.name = data.name || this.name;
    this.numEstimators = data.numEstimators || 25;
    this.learningRate = data.learningRate || 0.15;
    this.maxDepth = data.maxDepth || 4;
    this.baseLogOdds = data.baseLogOdds || 0;
    this.featureImportances = data.featureImportances || [];
    this.trees = (data.trees || []).map((tData: any) => {
      const tree = new RegressionTree();
      tree.fromJSON(tData);
      return tree;
    });
  }
}
