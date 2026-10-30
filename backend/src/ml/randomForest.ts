import { IMLModel, FEATURE_NAMES } from './types';
import { DecisionTreeModel } from './decisionTree';

export class RandomForestModel implements IMLModel {
  name = 'Random Forest';
  numTrees: number;
  maxDepth: number;
  minSamplesSplit: number;
  trees: DecisionTreeModel[] = [];
  featureImportances: { feature: string; importance: number }[] = [];

  constructor(numTrees = 20, maxDepth = 7, minSamplesSplit = 4) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  // Bootstrap sampling (sampling with replacement)
  private bootstrapSample(X: number[][], y: number[]): { sampleX: number[][]; sampleY: number[] } {
    const n = X.length;
    const sampleX: number[][] = [];
    const sampleY: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sampleX.push(X[idx]);
      sampleY.push(y[idx]);
    }
    return { sampleX, sampleY };
  }

  async train(X: number[][], y: number[]): Promise<void> {
    this.trees = [];
    const numFeatures = X[0].length;
    const aggregatedImportances = new Array(numFeatures).fill(0);

    for (let t = 0; t < this.numTrees; t++) {
      const { sampleX, sampleY } = this.bootstrapSample(X, y);
      const tree = new DecisionTreeModel(this.maxDepth, this.minSamplesSplit);
      await tree.train(sampleX, sampleY);
      this.trees.push(tree);

      // Accumulate importance from each tree
      for (let f = 0; f < numFeatures; f++) {
        aggregatedImportances[f] += tree.featureImportancesMap[f] || 0;
      }
    }

    const total = aggregatedImportances.reduce((s, v) => s + v, 0) || 1;
    this.featureImportances = aggregatedImportances.map((val, i) => ({
      feature: FEATURE_NAMES[i] || `Feature ${i}`,
      importance: parseFloat((val / total).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }

  predictProbability(X: number[][]): number[] {
    if (!this.trees.length) return X.map(() => 0.5);

    // Soft voting across all trees
    const treeProbs = this.trees.map((tree) => tree.predictProbability(X));
    const n = X.length;
    const result: number[] = [];

    for (let i = 0; i < n; i++) {
      let sumProb = 0;
      for (let t = 0; t < this.trees.length; t++) {
        sumProb += treeProbs[t][i];
      }
      result.push(parseFloat((sumProb / this.trees.length).toFixed(4)));
    }

    return result;
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
      numTrees: this.numTrees,
      maxDepth: this.maxDepth,
      minSamplesSplit: this.minSamplesSplit,
      trees: this.trees.map((t) => t.toJSON()),
      featureImportances: this.featureImportances,
    };
  }

  fromJSON(data: any) {
    this.name = data.name || this.name;
    this.numTrees = data.numTrees || 20;
    this.maxDepth = data.maxDepth || 7;
    this.minSamplesSplit = data.minSamplesSplit || 4;
    this.featureImportances = data.featureImportances || [];
    this.trees = (data.trees || []).map((tData: any) => {
      const tree = new DecisionTreeModel();
      tree.fromJSON(tData);
      return tree;
    });
  }
}
