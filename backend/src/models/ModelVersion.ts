import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureImportance {
  feature: string;
  importance: number;
}

export interface IConfusionMatrix {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface IModelVersion extends Document {
  model_name: string; // 'Logistic Regression' | 'Decision Tree' | 'Random Forest' | 'Gradient Boosted Trees'
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_score: number;
  is_active: boolean;
  trained_at: Date;
  training_samples: number;
  test_samples: number;
  hyperparameters: Record<string, any>;
  confusion_matrix: IConfusionMatrix;
  feature_importances: IFeatureImportance[];
  weights_path?: string;
  notes?: string;
}

const ModelVersionSchema = new Schema<IModelVersion>(
  {
    model_name: { type: String, required: true },
    version: { type: String, required: true, unique: true },
    accuracy: { type: Number, required: true },
    precision: { type: Number, required: true },
    recall: { type: Number, required: true },
    f1_score: { type: Number, required: true },
    auc_score: { type: Number, required: true },
    is_active: { type: Boolean, default: false, index: true },
    trained_at: { type: Date, default: Date.now },
    training_samples: { type: Number, default: 0 },
    test_samples: { type: Number, default: 0 },
    hyperparameters: { type: Schema.Types.Mixed, default: {} },
    confusion_matrix: {
      tp: { type: Number, default: 0 },
      fp: { type: Number, default: 0 },
      tn: { type: Number, default: 0 },
      fn: { type: Number, default: 0 },
    },
    feature_importances: [
      {
        feature: { type: String, required: true },
        importance: { type: Number, required: true },
      },
    ],
    weights_path: { type: String },
    notes: { type: String },
  },
  {
    timestamps: { createdAt: 'trained_at', updatedAt: false },
  }
);

export const ModelVersion = mongoose.model<IModelVersion>('ModelVersion', ModelVersionSchema);
