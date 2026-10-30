import { Request, Response } from 'express';
import { analyzeUrl } from '../services/urlAnalyzer';
import { ModelManager } from '../ml/modelManager';

export async function analyzeForExtension(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Valid URL is required' });
      return;
    }

    const result = await analyzeUrl({
      url: url.trim(),
      clientSource: 'extension',
      skipContentFetch: false,
    });

    res.json({
      scan_id: result.scanId,
      url: result.original_url,
      verdict: result.verdict,
      risk_score: result.risk_score,
      ml_prediction: result.ml_prediction,
      ml_probability: result.ml_probability,
      model_version: result.model_version,
      factors: result.detected_factors,
      threat_count: result.detected_factors.filter((f) => f.severity !== 'low').length,
      scan_status: result.scan_status,
      timestamp: result.created_at,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Extension analysis failed' });
  }
}

export async function getExtensionStatus(req: Request, res: Response): Promise<void> {
  const modelManager = ModelManager.getInstance();
  res.json({
    status: 'online',
    version: '1.0.0',
    active_model: modelManager.getActiveModelName(),
    timestamp: new Date().toISOString(),
  });
}
