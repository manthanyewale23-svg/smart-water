import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (_req: AuthRequest, res: Response): void => {
  try {
    const zones = db.prepare('SELECT * FROM zones ORDER BY name').all();
    res.json({ zones });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const zone = db.prepare('SELECT * FROM zones WHERE id = ?').get(req.params.id) as any;
    if (!zone) { res.status(404).json({ error: 'Zone not found' }); return; }
    const latestDate = db.prepare('SELECT MAX(date) as d FROM water_supply WHERE zone_id = ?').get(req.params.id) as any;
    const supply = latestDate?.d
      ? db.prepare('SELECT * FROM water_supply WHERE zone_id = ? AND date = ?').get(req.params.id, latestDate.d)
      : null;
    const sensors = db.prepare('SELECT * FROM sensors WHERE zone_id = ?').all(req.params.id);
    res.json({ zone, supply, sensors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
