import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function getLossStatus(pct: number): string {
  if (pct < 10) return 'LOW';
  if (pct < 20) return 'MEDIUM';
  return 'HIGH';
}

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's totals across all zones
    const todaySupply = db.prepare(`
      SELECT COALESCE(SUM(supplied),0) as total_supplied, COALESCE(SUM(consumed),0) as total_consumed
      FROM water_supply WHERE date = ?
    `).get(today) as any;

    // Fallback to latest date if today has no data
    const latestDate = db.prepare('SELECT MAX(date) as d FROM water_supply').get() as any;
    const useDate = todaySupply?.total_supplied > 0 ? today : latestDate?.d || today;

    const supply = db.prepare(`
      SELECT COALESCE(SUM(supplied),0) as total_supplied, COALESCE(SUM(consumed),0) as total_consumed
      FROM water_supply WHERE date = ?
    `).get(useDate) as any;

    const total_supplied = supply.total_supplied;
    const total_consumed = supply.total_consumed;
    const water_loss = total_supplied - total_consumed;
    const loss_pct = total_supplied > 0 ? (water_loss / total_supplied) * 100 : 0;

    // Counts
    const active_alerts = (db.prepare(`SELECT COUNT(*) as c FROM alerts WHERE status='active'`).get() as any).c;
    const open_complaints = (db.prepare(`SELECT COUNT(*) as c FROM complaints WHERE status NOT IN ('resolved','closed')`).get() as any).c;
    const pending_maintenance = (db.prepare(`SELECT COUNT(*) as c FROM maintenance_tasks WHERE status IN ('pending','in_progress')`).get() as any).c;
    const resolved_complaints = (db.prepare(`SELECT COUNT(*) as c FROM complaints WHERE status IN ('resolved','closed')`).get() as any).c;

    // Zone summary
    const zone_summary = db.prepare(`
      SELECT z.id, z.name, z.population,
        COALESCE(ws.supplied,0) as supplied,
        COALESCE(ws.consumed,0) as consumed,
        COALESCE(ws.supplied,0) - COALESCE(ws.consumed,0) as loss,
        CASE WHEN COALESCE(ws.supplied,0) > 0 
          THEN ROUND((COALESCE(ws.supplied,0) - COALESCE(ws.consumed,0)) * 100.0 / ws.supplied, 1)
          ELSE 0 END as loss_pct
      FROM zones z
      LEFT JOIN water_supply ws ON ws.zone_id = z.id AND ws.date = ?
      ORDER BY z.name
    `).all(useDate) as any[];

    // Daily consumption last 7 days
    const daily_consumption = db.prepare(`
      SELECT date, SUM(supplied) as supplied, SUM(consumed) as consumed
      FROM water_supply
      WHERE date >= date('now','-6 days')
      GROUP BY date ORDER BY date
    `).all() as any[];

    // Complaint status counts
    const complaint_rows = db.prepare('SELECT status, COUNT(*) as c FROM complaints GROUP BY status').all() as any[];
    const complaint_status_counts: Record<string, number> = {};
    complaint_rows.forEach((r: any) => { complaint_status_counts[r.status] = r.c; });

    // Maintenance status counts
    const maint_rows = db.prepare('SELECT status, COUNT(*) as c FROM maintenance_tasks GROUP BY status').all() as any[];
    const maintenance_status_counts: Record<string, number> = {};
    maint_rows.forEach((r: any) => { maintenance_status_counts[r.status] = r.c; });

    // Recent alerts
    const recent_alerts = db.prepare(`
      SELECT a.*, z.name as zone_name FROM alerts a
      LEFT JOIN zones z ON z.id = a.zone_id
      WHERE a.status = 'active' ORDER BY a.created_at DESC LIMIT 5
    `).all();

    // Recent complaints
    const recent_complaints = db.prepare(`
      SELECT c.*, u.name as citizen_name, z.name as zone_name,
        w.name as assigned_worker_name
      FROM complaints c
      LEFT JOIN users u ON u.id = c.citizen_id
      LEFT JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users w ON w.id = c.assigned_worker_id
      ORDER BY c.created_at DESC LIMIT 5
    `).all();

    res.json({
      summary: {
        total_supplied,
        total_consumed,
        water_loss,
        loss_percentage: Math.round(loss_pct * 10) / 10,
        loss_status: getLossStatus(loss_pct),
        active_alerts,
        open_complaints,
        pending_maintenance,
        resolved_complaints,
      },
      zone_summary,
      daily_consumption,
      complaint_status_counts,
      maintenance_status_counts,
      recent_alerts,
      recent_complaints,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
