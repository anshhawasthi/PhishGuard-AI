export class StandardScaler {
  means: number[] = [];
  stds: number[] = [];
  fitted: boolean = false;

  fit(X: number[][]): void {
    if (!X.length || !X[0].length) return;
    const numFeatures = X[0].length;
    this.means = new Array(numFeatures).fill(0);
    this.stds = new Array(numFeatures).fill(0);

    // Compute means
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        this.means[j] += X[i][j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      this.means[j] /= X.length;
    }

    // Compute standard deviations
    for (let i = 0; i < X.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        const diff = X[i][j] - this.means[j];
        this.stds[j] += diff * diff;
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      const variance = this.stds[j] / X.length;
      this.stds[j] = Math.sqrt(variance) || 1e-6; // Prevent zero division
    }

    this.fitted = true;
  }

  transform(X: number[][]): number[][] {
    if (!this.fitted) return X;
    return X.map((row) =>
      row.map((val, j) => {
        const mean = this.means[j] || 0;
        const std = this.stds[j] || 1;
        return (val - mean) / std;
      })
    );
  }

  fitTransform(X: number[][]): number[][] {
    this.fit(X);
    return this.transform(X);
  }

  toJSON() {
    return { means: this.means, stds: this.stds, fitted: this.fitted };
  }

  fromJSON(data: { means: number[]; stds: number[]; fitted: boolean }) {
    this.means = data.means || [];
    this.stds = data.stds || [];
    this.fitted = !!data.fitted;
  }
}
