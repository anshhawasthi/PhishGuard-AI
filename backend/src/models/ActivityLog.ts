import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  user_id?: mongoose.Types.ObjectId;
  action: string;
  description: string;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, index: true },
    description: { type: String, required: true },
    ip_address: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
