import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { analyzeUrl } from '../services/urlAnalyzer';
import { generatePdfReport } from '../services/pdfService';
import { getScanRecords, findScanById, deleteScanRecord } from '../database/scanStore';
import csvParser from 'csv-parser';
import stream from 'stream';

export async function analyze(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'A valid URL string is required' });
      return;
    }

    const userId = req.user?.id || null;
    const clientSource = (req.body.source as any) || 'web';

    const result = await analyzeUrl({
      url: url.trim(),
      userId,
      clientSource,
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to analyze URL' });
  }
}

export async function getScans(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '10', 10);
    const verdict = req.query.verdict as string;
    const search = req.query.search as string;

    const filter: any = {};
    if (req.user?.role !== 'admin' && req.user?.id) {
      filter.user_id = req.user.id;
    }
    if (verdict && ['safe', 'suspicious', 'phishing'].includes(verdict)) {
      filter.verdict = verdict;
    }

    const result = await getScanRecords(filter, { page, limit, search });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve scans' });
  }
}

export async function getScanById(req: Request, res: Response): Promise<void> {
  try {
    const scan_id = req.params.scan_id as string;
    const scan = await findScanById(scan_id);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found' });
      return;
    }

    res.json(scan);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve scan record' });
  }
}

export async function deleteScan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const scan_id = req.params.scan_id as string;
    const scan = await findScanById(scan_id);
    if (!scan) {
      res.status(404).json({ error: 'Scan record not found' });
      return;
    }

    if (req.user?.role !== 'admin' && scan.user_id && scan.user_id.toString() !== req.user?.id) {
      res.status(403).json({ error: 'Permission denied' });
      return;
    }

    await deleteScanRecord(scan_id);
    res.json({ message: 'Scan record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete scan' });
  }
}

export async function bulkScan(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    let urls: string[] = [];

    // Check if URLs passed in JSON body
    if (Array.isArray(req.body.urls)) {
      urls = req.body.urls.filter((u: any) => typeof u === 'string' && u.trim());
    } else if (req.file) {
      // Parse uploaded CSV file buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      const rows: string[] = [];
      await new Promise((resolve, reject) => {
        bufferStream
          .pipe(csvParser())
          .on('data', (row) => {
            const possibleUrl = row.url || row.URL || row.urls || row.Url || Object.values(row)[0];
            if (possibleUrl && typeof possibleUrl === 'string') {
              rows.push(possibleUrl.trim());
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });
      urls = rows;
    }

    if (urls.length === 0) {
      res.status(400).json({ error: 'No valid URLs found in request or uploaded CSV' });
      return;
    }

    // Limit bulk scan to 100 at a time for stability
    const maxBulk = 100;
    const targetUrls = urls.slice(0, maxBulk);

    const results: any[] = [];
    let safeCount = 0;
    let suspiciousCount = 0;
    let phishingCount = 0;

    // Process concurrently in chunks of 5
    const chunkSize = 5;
    for (let i = 0; i < targetUrls.length; i += chunkSize) {
      const chunk = targetUrls.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (u) => {
          try {
            return await analyzeUrl({
              url: u,
              userId: req.user?.id || null,
              clientSource: 'bulk',
              skipContentFetch: true, // fast analysis for bulk
            });
          } catch (err: any) {
            return {
              original_url: u,
              verdict: 'suspicious',
              risk_score: 50,
              error: err.message,
            };
          }
        })
      );

      for (const item of chunkResults) {
        if (item.verdict === 'safe') safeCount++;
        else if (item.verdict === 'phishing') phishingCount++;
        else suspiciousCount++;
        results.push(item);
      }
    }

    res.json({
      total: targetUrls.length,
      safe_count: safeCount,
      suspicious_count: suspiciousCount,
      phishing_count: phishingCount,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Bulk scan processing failed' });
  }
}

export async function downloadReport(req: Request, res: Response): Promise<void> {
  try {
    const scan_id = req.params.scan_id as string;
    let scanData: any = await findScanById(scan_id);

    // If not found, check if URL was passed via query
    if (!scanData) {
      const urlParam = req.query.url as string;
      if (urlParam) {
        scanData = await analyzeUrl({ url: urlParam });
      } else {
        res.status(404).json({ error: 'Scan record not found' });
        return;
      }
    }

    const pdfBuffer = await generatePdfReport(scanData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="PhishGuard_Report_${scan_id || 'scan'}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate PDF report' });
  }
}
