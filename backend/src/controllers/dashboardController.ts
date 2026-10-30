import { Request, Response } from 'express';
import { Scan } from '../models/Scan';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { isDbConnected } from '../database/connection';
import { getScanRecords } from '../database/scanStore';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected()) {
      const allScansRes = await getScanRecords({}, { limit: 1000 });
      const localScans = allScansRes.scans || [];
      const safe_scans = localScans.filter((s: any) => s.verdict === 'safe').length;
      const suspicious_scans = localScans.filter((s: any) => s.verdict === 'suspicious').length;
      const phishing_scans = localScans.filter((s: any) => s.verdict === 'phishing').length;

      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const now = new Date();
      const daily_activity: any[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        daily_activity.push({
          date: days[d.getDay()],
          scans: localScans.filter((s: any) => new Date(s.created_at).toDateString() === d.toDateString()).length,
          phishing: localScans.filter((s: any) => s.verdict === 'phishing' && new Date(s.created_at).toDateString() === d.toDateString()).length,
        });
      }

      res.json({
        total_scans: localScans.length,
        safe_scans,
        suspicious_scans,
        phishing_scans,
        total_users: 1,
        threat_distribution: [
          { name: 'Safe', value: safe_scans, color: '#10B981' },
          { name: 'Suspicious', value: suspicious_scans, color: '#F59E0B' },
          { name: 'Phishing', value: phishing_scans, color: '#EF4444' },
        ],
        daily_activity,
        database_connected: false,
      });
      return;
    }

    const [total_scans, safe_scans, suspicious_scans, phishing_scans, total_users] =
      await Promise.all([
        Scan.countDocuments(),
        Scan.countDocuments({ verdict: 'safe' }),
        Scan.countDocuments({ verdict: 'suspicious' }),
        Scan.countDocuments({ verdict: 'phishing' }),
        User.countDocuments(),
      ]);

    // Build last 7 days time series
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const daily_activity: any[] = [];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59);

      const dayScans = await Scan.countDocuments({
        created_at: { $gte: dayStart, $lte: dayEnd },
      });
      const dayPhish = await Scan.countDocuments({
        created_at: { $gte: dayStart, $lte: dayEnd },
        verdict: 'phishing',
      });

      daily_activity.push({
        date: days[dayStart.getDay()],
        scans: dayScans,
        phishing: dayPhish,
      });
    }

    res.json({
      total_scans,
      safe_scans,
      suspicious_scans,
      phishing_scans,
      total_users,
      threat_distribution: [
        { name: 'Safe', value: safe_scans, color: '#10B981' },
        { name: 'Suspicious', value: suspicious_scans, color: '#F59E0B' },
        { name: 'Phishing', value: phishing_scans, color: '#EF4444' },
      ],
      daily_activity,
      database_connected: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve stats' });
  }
}

export async function getRecentActivity(req: Request, res: Response): Promise<void> {
  try {
    if (!isDbConnected()) {
      res.json({ activity: [] });
      return;
    }

    const limit = parseInt(req.query.limit as string || '15', 10);
    const logs = await ActivityLog.find()
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('user_id', 'full_name email')
      .lean();

    res.json({ activity: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve activity' });
  }
}
