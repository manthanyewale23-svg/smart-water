import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { zone_id, period = '7d' } = req.query as any;

    let startDate = new Date();
    if (period === '30d') startDate.setDate(startDate.getDate() - 29);
    else if (period === 'today') startDate = new Date();
    else startDate.setDate(startDate.getDate() - 6);
    const start = startDate.toISOString().split('T')[0];
    const end = new Date().toISOString().split('T')[0];

    let query = `
      SELECT z.id as zone_id, z.name as zone_name,
        SUM(ws.supplied) as total_supplied,
        SUM(ws.consumed) as total_consumed,
        SUM(ws.supplied) - SUM(ws.consumed) as total_loss,
        CASE WHEN SUM(ws.supplied) > 0
          THEN ROUND((SUM(ws.supplied) - SUM(ws.consumed)) * 100.0 / SUM(ws.supplied), 1)
          ELSE 0 END as loss_percentage
      FROM water_supply ws
      JOIN zones z ON z.id = ws.zone_id
      WHERE ws.date BETWEEN ? AND ?
    `;
    const params: any[] = [start, end];
    if (zone_id) { query += ' AND ws.zone_id = ?'; params.push(zone_id); }
    query += ' GROUP BY ws.zone_id ORDER BY loss_percentage DESC';

    const zones = db.prepare(query).all(...params) as any[];
    const result = zones.map((z: any) => ({
      ...z,
      loss_status: z.loss_percentage < 10 ? 'LOW' : z.loss_percentage < 20 ? 'MEDIUM' : 'HIGH'
    }));

    res.json({ data: result, period, start, end });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
