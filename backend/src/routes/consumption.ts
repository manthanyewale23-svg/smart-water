import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function getDateRange(period: string, start_date?: string, end_date?: string): { start: string; end: string } {
  const today = new Date().toISOString().split('T')[0];
  if (period === 'today') return { start: today, end: today };
  if (period === '7d') {
    const s = new Date(); s.setDate(s.getDate() - 6);
    return { start: s.toISOString().split('T')[0], end: today };
  }
  if (period === '30d') {
    const s = new Date(); s.setDate(s.getDate() - 29);
    return { start: s.toISOString().split('T')[0], end: today };
  }
  if (start_date && end_date) return { start: start_date, end: end_date };
  const s = new Date(); s.setDate(s.getDate() - 6);
  return { start: s.toISOString().split('T')[0], end: today };
}

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { zone_id, period = '7d', start_date, end_date } = req.query as any;
    const { start, end } = getDateRange(period, start_date, end_date);

    let query = `
      SELECT ws.date, z.id as zone_id, z.name as zone_name, 
        SUM(ws.supplied) as supplied, SUM(ws.consumed) as consumed,
        SUM(ws.supplied) - SUM(ws.consumed) as loss,
        CASE WHEN SUM(ws.supplied) > 0 
          THEN ROUND((SUM(ws.supplied) - SUM(ws.consumed)) * 100.0 / SUM(ws.supplied), 1)
          ELSE 0 END as loss_percentage
      FROM water_supply ws
      JOIN zones z ON z.id = ws.zone_id
      WHERE ws.date BETWEEN ? AND ?
    `;
    const params: any[] = [start, end];
    if (zone_id) { query += ' AND ws.zone_id = ?'; params.push(zone_id); }
    query += ' GROUP BY ws.date, ws.zone_id ORDER BY ws.date, z.name';

    const data = db.prepare(query).all(...params) as any[];

    // Daily totals (all zones combined)
    const dailyQuery = `
      SELECT date, SUM(supplied) as supplied, SUM(consumed) as consumed,
        SUM(supplied)-SUM(consumed) as loss
      FROM water_supply WHERE date BETWEEN ? AND ?
      ${zone_id ? 'AND zone_id = ?' : ''}
      GROUP BY date ORDER BY date
    `;
    const dailyParams: any[] = zone_id ? [start, end, zone_id] : [start, end];
    const daily = db.prepare(dailyQuery).all(...dailyParams);

    // Totals
    const totals = db.prepare(`
      SELECT SUM(supplied) as total_supplied, SUM(consumed) as total_consumed,
        SUM(supplied)-SUM(consumed) as total_loss
      FROM water_supply WHERE date BETWEEN ? AND ? ${zone_id ? 'AND zone_id = ?' : ''}
    `).get(...dailyParams) as any;

    res.json({ data, daily, totals, period, start, end });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
