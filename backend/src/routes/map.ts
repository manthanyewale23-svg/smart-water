import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/assets', authenticate, (_req: AuthRequest, res: Response): void => {
  try {
    const assets = db.prepare(`
      SELECT wa.*, z.name as zone_name FROM water_assets wa
      LEFT JOIN zones z ON z.id = wa.zone_id
    `).all() as any[];

    const sensors = db.prepare(`
      SELECT s.*, z.name as zone_name FROM sensors s
      LEFT JOIN zones z ON z.id = s.zone_id
    `).all() as any[];

    const complaints = db.prepare(`
      SELECT c.*, u.name as citizen_name, z.name as zone_name
      FROM complaints c
      LEFT JOIN users u ON u.id = c.citizen_id
      LEFT JOIN zones z ON z.id = c.zone_id
      WHERE c.status NOT IN ('resolved','closed') AND c.latitude IS NOT NULL
    `).all() as any[];

    const features = [
      ...assets.filter((a: any) => a.latitude && a.longitude).map((a: any) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [a.longitude, a.latitude] },
        properties: {
          id: a.id,
          feature_type: a.asset_type,
          name: a.name,
          zone_id: a.zone_id,
          zone_name: a.zone_name,
          status: a.status,
          description: a.description,
          metadata: a.metadata ? JSON.parse(a.metadata) : {},
        }
      })),
      ...sensors.map((s: any) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {
          id: s.id,
          feature_type: 'sensor',
          sensor_type: s.sensor_type,
          sensor_id: s.sensor_id,
          name: `${s.sensor_type.replace('_', ' ').toUpperCase()} ${s.sensor_id}`,
          zone_id: s.zone_id,
          zone_name: s.zone_name,
          status: s.status,
          last_reading: s.last_reading,
          unit: s.unit,
          last_updated: s.last_updated,
        }
      })),
      ...complaints.map((c: any) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
        properties: {
          id: c.id,
          feature_type: 'complaint',
          name: `Complaint ${c.id.slice(-6).toUpperCase()}`,
          problem_type: c.problem_type,
          priority: c.priority,
          status: c.status,
          description: c.description,
          citizen_name: c.citizen_name,
          zone_name: c.zone_name,
          created_at: c.created_at,
        }
      })),
    ];

    res.json({ type: 'FeatureCollection', features });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
