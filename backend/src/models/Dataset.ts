import mongoose, { Document, Schema } from 'mongoose';

export interface IDataset extends Document {
  dataset_name: string;
  dataset_type: 'phishing' | 'legitimate' | 'mixed';
  record_count: number;
  uploaded_by: mongoose.Types.ObjectId;
  filepath: string;
  filename: string;
  description?: string;
  created_at: Date;
}

const DatasetSchema = new Schema<IDataset>(
  {
    dataset_name: { type: String, required: true, trim: true },
    dataset_type: { type: String, enum: ['phishing', 'legitimate', 'mixed'], required: true },
    record_count: { type: Number, required: true, default: 0 },
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    filepath: { type: String, required: true },
    filename: { type: String, required: true },
    description: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const Dataset = mongoose.model<IDataset>('Dataset', DatasetSchema);
