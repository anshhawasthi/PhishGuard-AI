import { IMLModel, FEATURE_NAMES } from './types';

export class LogisticRegressionModel implements IMLModel {
  name = 'Logistic Regression';
  weights: number[] = [];
  bias: number = 0;
  learningRate: number;
  epochs: number;
  l2Reg: number;

  constructor(learningRate = 0.05, epochs = 250, l2Reg = 0.001) {
    this.learningRate = learningRate;
    this.epochs = epochs;
    this.l2Reg = l2Reg;
  }

  private sigmoid(z: number): number {
    if (z > 20) return 1;
    if (z < -20) return 0;
    return 1 / (1 + Math.exp(-z));
  }

  async train(X: number[][], y: number[]): Promise<void> {
    const numSamples = X.length;
    const numFeatures = X[0].length;

    // Initialize weights and bias with small values
    this.weights = new Array(numFeatures).fill(0).map(() => (Math.random() - 0.5) * 0.01);
    this.bias = 0;

    // Gradient descent optimization
    for (let epoch = 0; epoch < this.epochs; epoch++) {
      const dw = new Array(numFeatures).fill(0);
      let db = 0;

      for (let i = 0; i < numSamples; i++) {
        let z = this.bias;
        for (let j = 0; j < numFeatures; j++) {
          z += this.weights[j] * X[i][j];
        }
        const yPred = this.sigmoid(z);
        const error = yPred - y[i];

        for (let j = 0; j < numFeatures; j++) {
          dw[j] += error * X[i][j];
        }
        db += error;
      }

      // Update parameters with L2 regularization
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= this.learningRate * (dw[j] / numSamples + this.l2Reg * this.weights[j]);
      }
      this.bias -= this.learningRate * (db / numSamples);
    }
  }

  predictProbability(X: number[][]): number[] {
    return X.map((row) => {
      let z = this.bias;
      for (let j = 0; j < row.length; j++) {
        z += (this.weights[j] || 0) * row[j];
      }
      return parseFloat(this.sigmoid(z).toFixed(4));
    });
  }

  predict(X: number[][]): number[] {
    return this.predictProbability(X).map((prob) => (prob >= 0.5 ? 1 : 0));
  }

  getFeatureImportances(): { feature: string; importance: number }[] {
    const totalAbs = this.weights.reduce((sum, w) => sum + Math.abs(w), 0) || 1;
    return this.weights.map((w, i) => ({
      feature: FEATURE_NAMES[i] || `Feature ${i}`,
      importance: parseFloat((Math.abs(w) / totalAbs).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);
  }

  toJSON() {
    return {
      name: this.name,
      weights: this.weights,
      bias: this.bias,
      learningRate: this.learningRate,
      epochs: this.epochs,
      l2Reg: this.l2Reg,
    };
  }

  fromJSON(data: any) {
    this.name = data.name || this.name;
    this.weights = data.weights || [];
    this.bias = data.bias || 0;
    this.learningRate = data.learningRate || 0.05;
    this.epochs = data.epochs || 250;
    this.l2Reg = data.l2Reg || 0.001;
  }
}
