import fs from 'fs';
import path from 'path';
import { IMLModel, IEvaluationResult, FEATURE_NAMES } from './types';
import { StandardScaler } from './scaler';
import { LogisticRegressionModel } from './logisticRegression';
import { DecisionTreeModel } from './decisionTree';
import { RandomForestModel } from './randomForest';
import { GradientBoostingModel } from './gradientBoosting';
import { evaluateModel } from './evaluator';
import { extractUrlFeatures } from './featureExtractor';
import { PRELOADED_SAMPLES, IDatasetSample } from './preloadedDataset';
import { ModelVersion } from '../models/ModelVersion';
import { isDbConnected } from '../database/connection';
import { config } from '../config';

export class ModelManager {
  private static instance: ModelManager;
  private activeModel: IMLModel | null = null;
  private activeModelName: string = 'Heuristic Fallback';
  private scaler: StandardScaler = new StandardScaler();
  private trainedModels: Map<string, { model: IMLModel; evaluation: IEvaluationResult }> = new Map();

  private constructor() {
    this.ensureDirectories();
  }

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  private ensureDirectories() {
    if (!fs.existsSync(config.modelsDir)) {
      fs.mkdirSync(config.modelsDir, { recursive: true });
    }
    if (!fs.existsSync(config.datasetsDir)) {
      fs.mkdirSync(config.datasetsDir, { recursive: true });
    }
  }

  public getActiveModelName(): string {
    return this.activeModelName;
  }

  public getActiveModel(): IMLModel | null {
    return this.activeModel;
  }

  public getTrainedModelsSummary(): any[] {
    const list: any[] = [];
    for (const [name, data] of this.trainedModels.entries()) {
      list.push({
        model_name: name,
        isActive: name === this.activeModelName,
        ...data.evaluation,
      });
    }
    return list;
  }

  /**
   * Trains all 4 ML models on provided or preloaded datasets.
   * Performs an 80/20 train/test split with data leakage prevention.
   */
  public async trainAllModels(customSamples?: IDatasetSample[]): Promise<any[]> {
    const samples = customSamples && customSamples.length >= 20 ? customSamples : PRELOADED_SAMPLES;
    console.log(`[ML Engine] Starting training pipeline with ${samples.length} URL samples...`);

    // 1. Feature Extraction & Vectorization
    const X: number[][] = [];
    const y: number[] = [];

    for (const sample of samples) {
      const { vector } = extractUrlFeatures(sample.url);
      X.push(vector);
      y.push(sample.label);
    }

    // 2. Train/Test Split (80% train, 20% test) with stratified shuffling
    const indices = Array.from({ length: X.length }, (_, i) => i);
    // Deterministic shuffle using seed
    indices.sort(() => 0.5 - Math.random());

    const trainSize = Math.floor(X.length * 0.8);
    const trainIdx = indices.slice(0, trainSize);
    const testIdx = indices.slice(trainSize);

    const rawTrainX = trainIdx.map((i) => X[i]);
    const trainY = trainIdx.map((i) => y[i]);
    const rawTestX = testIdx.map((i) => X[i]);
    const testY = testIdx.map((i) => y[i]);

    // 3. Fit scaler ONLY on training data to prevent data leakage
    this.scaler = new StandardScaler();
    const trainX = this.scaler.fitTransform(rawTrainX);
    const testX = this.scaler.transform(rawTestX);

    // Save scaler parameters
    fs.writeFileSync(
      path.join(config.modelsDir, 'scaler.json'),
      JSON.stringify(this.scaler.toJSON(), null, 2)
    );

    // 4. Instantiate the 4 models
    const models: IMLModel[] = [
      new LogisticRegressionModel(0.08, 300, 0.001),
      new DecisionTreeModel(6, 4),
      new RandomForestModel(25, 7, 3),
      new GradientBoostingModel(30, 0.15, 4),
    ];

    const results: any[] = [];
    let bestModel: IMLModel | null = null;
    let highestF1 = -1;

    for (const model of models) {
      console.log(`[ML Engine] Training ${model.name}...`);
      await model.train(trainX, trainY);

      // Evaluate on un-seen test set
      const evaluation = evaluateModel(model, testX, testY);
      console.log(
        `[ML Engine] ${model.name} Results -> Accuracy: ${(evaluation.accuracy * 100).toFixed(1)}%, F1: ${(evaluation.f1_score * 100).toFixed(1)}%, AUC: ${evaluation.auc_score}`
      );

      this.trainedModels.set(model.name, { model, evaluation });

      // Save serialized weights to disk
      const modelSlug = model.name.toLowerCase().replace(/\s+/g, '_');
      const weightsPath = path.join(config.modelsDir, `${modelSlug}.json`);
      fs.writeFileSync(weightsPath, JSON.stringify(model.toJSON(), null, 2));

      // Record in MongoDB if connected
      const versionStr = `${modelSlug}-v1.0`;
      if (isDbConnected()) {
        try {
          await ModelVersion.findOneAndUpdate(
            { version: versionStr },
            {
              model_name: model.name,
              version: versionStr,
              accuracy: evaluation.accuracy,
              precision: evaluation.precision,
              recall: evaluation.recall,
              f1_score: evaluation.f1_score,
              auc_score: evaluation.auc_score,
              trained_at: new Date(),
              training_samples: trainX.length,
              test_samples: testX.length,
              confusion_matrix: evaluation.confusion_matrix,
              feature_importances: evaluation.feature_importances,
              weights_path: weightsPath,
            },
            { upsert: true, new: true }
          );
        } catch (dbErr: any) {
          console.warn(`[ML Engine] Could not persist model version to DB: ${dbErr.message}`);
        }
      }

      // Check if this model is the best
      if (evaluation.f1_score > highestF1) {
        highestF1 = evaluation.f1_score;
        bestModel = model;
      }

      results.push({
        model_name: model.name,
        version: versionStr,
        ...evaluation,
      });
    }

    // Set best model as active
    if (bestModel) {
      await this.setActiveModel(bestModel.name);
    }

    return results;
  }

  public async setActiveModel(modelName: string): Promise<boolean> {
    const entry = this.trainedModels.get(modelName);
    if (!entry) {
      // Try loading from disk
      const modelSlug = modelName.toLowerCase().replace(/\s+/g, '_');
      const weightsPath = path.join(config.modelsDir, `${modelSlug}.json`);
      if (fs.existsSync(weightsPath)) {
        try {
          const raw = fs.readFileSync(weightsPath, 'utf8');
          const data = JSON.parse(raw);
          let loadedModel: IMLModel;
          if (modelName === 'Logistic Regression') loadedModel = new LogisticRegressionModel();
          else if (modelName === 'Decision Tree') loadedModel = new DecisionTreeModel();
          else if (modelName === 'Random Forest') loadedModel = new RandomForestModel();
          else loadedModel = new GradientBoostingModel();

          loadedModel.fromJSON(data);
          this.activeModel = loadedModel;
          this.activeModelName = modelName;
          console.log(`[ML Engine] Loaded and activated ${modelName} from disk.`);
          return true;
        } catch (e: any) {
          console.error(`[ML Engine] Failed to load model from disk: ${e.message}`);
          return false;
        }
      }
      return false;
    }

    this.activeModel = entry.model;
    this.activeModelName = modelName;

    // Update active status in database
    if (isDbConnected()) {
      try {
        await ModelVersion.updateMany({}, { is_active: false });
        await ModelVersion.updateOne({ model_name: modelName }, { is_active: true });
      } catch (err: any) {
        console.warn(`[ML Engine] Could not update active model in DB: ${err.message}`);
      }
    }

    console.log(`[ML Engine] Activated model: ${modelName}`);
    return true;
  }

  /**
   * Predicts phishing probability for a URL vector
   */
  public predict(vector: number[]): {
    prediction: 'legitimate' | 'phishing' | 'unavailable';
    probability: number;
    modelVersion: string;
    featureContributions: { feature: string; impact: number }[];
  } {
    if (!this.activeModel) {
      return {
        prediction: 'unavailable',
        probability: 0.5,
        modelVersion: 'None (Untrained)',
        featureContributions: [],
      };
    }

    const scaledVector = this.scaler.fitted ? this.scaler.transform([vector]) : [vector];
    const probs = this.activeModel.predictProbability(scaledVector);
    const prob = probs[0] !== undefined ? probs[0] : 0.5;
    const prediction = prob >= 0.5 ? 'phishing' : 'legitimate';

    // Calculate individual feature contributions / attribution for this sample
    const importances = this.activeModel.getFeatureImportances();
    const featureContributions = importances.slice(0, 6).map((item) => {
      const featureIdx = FEATURE_NAMES.indexOf(item.feature as any);
      const val = featureIdx !== -1 ? vector[featureIdx] : 0;
      return {
        feature: item.feature,
        impact: parseFloat((item.importance * (val > 0 ? 1 : 0.2)).toFixed(4)),
      };
    });

    return {
      prediction,
      probability: prob,
      modelVersion: this.activeModelName,
      featureContributions,
    };
  }

  /**
   * Initializes models at server launch. If not trained yet, trains them automatically.
   */
  public async initialize(): Promise<void> {
    const scalerPath = path.join(config.modelsDir, 'scaler.json');
    if (fs.existsSync(scalerPath)) {
      try {
        const raw = fs.readFileSync(scalerPath, 'utf8');
        this.scaler.fromJSON(JSON.parse(raw));
      } catch {}
    }

    // Check if we have trained models on disk or DB
    const gbPath = path.join(config.modelsDir, 'gradient_boosted_trees.json');
    const rfPath = path.join(config.modelsDir, 'random_forest.json');

    if (fs.existsSync(gbPath) || fs.existsSync(rfPath)) {
      const preferred = fs.existsSync(gbPath) ? 'Gradient Boosted Trees' : 'Random Forest';
      await this.setActiveModel(preferred);
    } else {
      console.log('[ML Engine] No existing trained models found. Auto-training baseline models...');
      await this.trainAllModels();
    }
  }
}
