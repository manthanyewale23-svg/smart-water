import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { status, zone_id, severity } = req.query as any;
    let query = 'SELECT a.*, z.name as zone_name FROM alerts a LEFT JOIN zones z ON z.id = a.zone_id WHERE 1=1';
    const params: any[] = [];
    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (zone_id) { query += ' AND a.zone_id = ?'; params.push(zone_id); }
    if (severity) { query += ' AND a.severity = ?'; params.push(severity); }
    query += ' ORDER BY a.created_at DESC';
    const alerts = db.prepare(query).all(...params);
    res.json({ alerts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { status } = req.body;
    if (!status) { res.status(400).json({ error: 'status required' }); return; }
    db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
