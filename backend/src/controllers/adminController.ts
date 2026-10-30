import { Request, Response } from 'express';
import { User } from '../models/User';
import { Scan } from '../models/Scan';
import { Dataset } from '../models/Dataset';
import { ModelVersion } from '../models/ModelVersion';
import { ActivityLog } from '../models/ActivityLog';
import { ModelManager } from '../ml/modelManager';
import { isDbConnected } from '../database/connection';
import { AuthenticatedRequest } from '../middleware/auth';
import { IDatasetSample } from '../ml/preloadedDataset';
import csvParser from 'csv-parser';
import stream from 'stream';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected()) {
      res.json({ users: [] });
      return;
    }
    const users = await User.find().select('-password_hash').sort({ created_at: -1 }).lean();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { user_id } = req.params;
    if (!isDbConnected()) {
      res.status(503).json({ error: 'DB unavailable' });
      return;
    }

    const user = await User.findById(user_id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.is_active = !user.is_active;
    await user.save();
    res.json({ message: `User status changed to ${user.is_active ? 'active' : 'inactive'}`, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAdminStats(req: Request, res: Response): Promise<void> {
  try {
    const modelManager = ModelManager.getInstance();
    const activeModelName = modelManager.getActiveModelName();
    const modelsSummary = modelManager.getTrainedModelsSummary();

    let totalUsers = 1;
    let totalScans = 0;
    let phishingDetections = 0;
    let safeDetections = 0;
    let suspiciousDetections = 0;
    let datasetCount = 0;

    if (isDbConnected()) {
      [totalUsers, totalScans, phishingDetections, safeDetections, suspiciousDetections, datasetCount] =
        await Promise.all([
          User.countDocuments(),
          Scan.countDocuments(),
          Scan.countDocuments({ verdict: 'phishing' }),
          Scan.countDocuments({ verdict: 'safe' }),
          Scan.countDocuments({ verdict: 'suspicious' }),
          Dataset.countDocuments(),
        ]);
    }

    res.json({
      totalUsers,
      totalScans,
      phishingDetections,
      safeDetections,
      suspiciousDetections,
      datasetCount,
      activeModelName,
      modelsSummary,
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function uploadDataset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { dataset_name, dataset_type, description } = req.body;
    if (!req.file) {
      res.status(400).json({ error: 'Please upload a CSV dataset file' });
      return;
    }

    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const parsedSamples: IDatasetSample[] = [];
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on('data', (row) => {
          const url = row.url || row.URL || row.urls || row.Url || Object.values(row)[0];
          const rawLabel = row.label || row.Label || row.class || row.target || row.phishing;
          const label = parseInt(rawLabel, 10) === 1 || rawLabel === 'bad' || rawLabel === 'phishing' ? 1 : 0;
          if (url && typeof url === 'string') {
            parsedSamples.push({
              url: url.trim(),
              label,
              source: 'Kaggle',
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Save CSV to disk
    const filename = `${Date.now()}_${req.file.originalname}`;
    const targetPath = path.join(config.datasetsDir, filename);
    fs.writeFileSync(targetPath, req.file.buffer);

    if (isDbConnected() && req.user) {
      await Dataset.create({
        dataset_name: dataset_name || req.file.originalname,
        dataset_type: (dataset_type as any) || 'mixed',
        record_count: parsedSamples.length,
        uploaded_by: req.user.id,
        filepath: targetPath,
        filename,
        description: description || '',
      });
    }

    res.json({
      message: 'Dataset uploaded and processed successfully',
      filename,
      records_imported: parsedSamples.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Dataset upload failed' });
  }
}

export async function trainModels(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const modelManager = ModelManager.getInstance();
    const results = await modelManager.trainAllModels();

    if (isDbConnected() && req.user) {
      await ActivityLog.create({
        user_id: req.user.id,
        action: 'ML_TRAIN_ALL',
        description: `Admin initiated full training benchmark across 4 ML models.`,
      }).catch(() => {});
    }

    res.json({
      message: 'Machine Learning models trained and benchmarked successfully',
      models: results,
      activeModel: modelManager.getActiveModelName(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Model training failed' });
  }
}

export async function getModelPerformance(req: Request, res: Response): Promise<void> {
  try {
    const modelManager = ModelManager.getInstance();
    let models = modelManager.getTrainedModelsSummary();

    // If memory summary is empty, fetch from MongoDB or disk
    if (models.length === 0 && isDbConnected()) {
      const dbModels = await ModelVersion.find().lean();
      models = dbModels.map((m) => ({
        model_name: m.model_name,
        isActive: m.is_active,
        accuracy: m.accuracy,
        precision: m.precision,
        recall: m.recall,
        f1_score: m.f1_score,
        auc_score: m.auc_score,
        confusion_matrix: m.confusion_matrix,
        feature_importances: m.feature_importances,
      }));
    }

    res.json({
      activeModel: modelManager.getActiveModelName(),
      models,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve model performance' });
  }
}

export async function activateModel(req: Request, res: Response): Promise<void> {
  try {
    const { model_name } = req.body;
    if (!model_name) {
      res.status(400).json({ error: 'model_name is required' });
      return;
    }

    const modelManager = ModelManager.getInstance();
    const success = await modelManager.setActiveModel(model_name);

    if (!success) {
      res.status(404).json({ error: `Model "${model_name}" could not be activated.` });
      return;
    }

    res.json({
      message: `Active model switched to ${model_name}`,
      activeModel: model_name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
