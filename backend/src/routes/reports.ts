import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { type = 'weekly', zone_id, start_date, end_date } = req.query as any;
    const today = new Date().toISOString().split('T')[0];
    let start = start_date, end = end_date || today;

    if (!start) {
      const d = new Date();
      if (type === 'daily') { start = today; }
      else if (type === 'weekly') { d.setDate(d.getDate() - 6); start = d.toISOString().split('T')[0]; }
      else if (type === 'monthly') { d.setDate(d.getDate() - 29); start = d.toISOString().split('T')[0]; }
      else { d.setDate(d.getDate() - 29); start = d.toISOString().split('T')[0]; }
    }

    let data: any = {};

    if (type === 'complaints') {
      data.summary = db.prepare('SELECT status, COUNT(*) as count FROM complaints GROUP BY status').all();
      data.by_zone = db.prepare('SELECT z.name as zone_name, COUNT(*) as count FROM complaints c LEFT JOIN zones z ON z.id = c.zone_id WHERE c.created_at >= ? GROUP BY c.zone_id').all(start + 'T00:00:00');
      data.by_type = db.prepare('SELECT problem_type, COUNT(*) as count FROM complaints GROUP BY problem_type').all();
      data.list = db.prepare('SELECT c.*, u.name as citizen_name, z.name as zone_name FROM complaints c LEFT JOIN users u ON u.id = c.citizen_id LEFT JOIN zones z ON z.id = c.zone_id WHERE c.created_at >= ? ORDER BY c.created_at DESC').all(start + 'T00:00:00');
    } else if (type === 'maintenance') {
      data.summary = db.prepare('SELECT status, COUNT(*) as count FROM maintenance_tasks GROUP BY status').all();
      data.list = db.prepare('SELECT m.*, w.name as worker_name, z.name as zone_name FROM maintenance_tasks m LEFT JOIN users w ON w.id = m.worker_id LEFT JOIN zones z ON z.id = m.zone_id ORDER BY m.created_at DESC').all();
    } else if (type === 'zone-loss') {
      const query = `SELECT z.name as zone_name, SUM(ws.supplied) as supplied, SUM(ws.consumed) as consumed,
        SUM(ws.supplied)-SUM(ws.consumed) as loss,
        CASE WHEN SUM(ws.supplied)>0 THEN ROUND((SUM(ws.supplied)-SUM(ws.consumed))*100.0/SUM(ws.supplied),1) ELSE 0 END as loss_pct
        FROM water_supply ws JOIN zones z ON z.id = ws.zone_id
        WHERE ws.date BETWEEN ? AND ? ${zone_id ? 'AND ws.zone_id=?' : ''}
        GROUP BY ws.zone_id ORDER BY loss_pct DESC`;
      const params: any[] = [start, end];
      if (zone_id) params.push(zone_id);
      data.list = db.prepare(query).all(...params);
    } else {
      // daily/weekly/monthly water report
      const query = `SELECT ws.date, z.name as zone_name, ws.supplied, ws.consumed,
        ws.supplied-ws.consumed as loss,
        CASE WHEN ws.supplied>0 THEN ROUND((ws.supplied-ws.consumed)*100.0/ws.supplied,1) ELSE 0 END as loss_pct
        FROM water_supply ws JOIN zones z ON z.id = ws.zone_id
        WHERE ws.date BETWEEN ? AND ? ${zone_id ? 'AND ws.zone_id=?' : ''}
        ORDER BY ws.date DESC, z.name`;
      const params: any[] = [start, end];
      if (zone_id) params.push(zone_id);
      data.list = db.prepare(query).all(...params);

      data.totals = db.prepare(`SELECT SUM(supplied) as total_supplied, SUM(consumed) as total_consumed, SUM(supplied)-SUM(consumed) as total_loss FROM water_supply WHERE date BETWEEN ? AND ? ${zone_id ? 'AND zone_id=?' : ''}`).get(...params);
      data.daily = db.prepare(`SELECT date, SUM(supplied) as supplied, SUM(consumed) as consumed FROM water_supply WHERE date BETWEEN ? AND ? ${zone_id ? 'AND zone_id=?' : ''} GROUP BY date ORDER BY date`).all(...params);
    }

    res.json({ type, start, end, ...data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
