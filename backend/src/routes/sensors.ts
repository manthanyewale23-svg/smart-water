import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/sensors
router.get('/', authenticate, (_req: AuthRequest, res: Response): void => {
  try {
    const sensors = db.prepare(`
      SELECT s.*, z.name as zone_name
      FROM sensors s LEFT JOIN zones z ON z.id = s.zone_id
      ORDER BY s.zone_id, s.sensor_type
    `).all();
    res.json({ sensors });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sensors/demo-update
router.post('/demo-update', authenticate, authorize('admin'), (_req: AuthRequest, res: Response): void => {
  try {
    const sensors = db.prepare('SELECT * FROM sensors WHERE status != ?').all('offline') as any[];
    const updatedSensors = [];
    let alertCreated = null;

    const insertReading = db.prepare('INSERT INTO sensor_readings (id,sensor_id,flow,pressure,tank_level,consumption,recorded_at) VALUES (?,?,?,?,?,?,?)');
    const updateSensor = db.prepare('UPDATE sensors SET last_reading = ?, last_updated = ?, status = ? WHERE id = ?');

    for (const sensor of sensors) {
      const variation = 0.97 + Math.random() * 0.06; // ±3%
      let newReading = Math.round(sensor.last_reading * variation * 100) / 100;
      let flow = null, pressure = null, tank_level = null, consumption = null;
      let newStatus = 'normal';

      if (sensor.sensor_type === 'flow') {
        flow = newReading;
        if (newReading < 400) newStatus = 'critical';
        else if (newReading < 600) newStatus = 'warning';
      } else if (sensor.sensor_type === 'pressure') {
        pressure = newReading;
        if (newReading < 1.0) newStatus = 'critical';
        else if (newReading < 1.5) newStatus = 'warning';
        // Simulate gradual pressure drop for demo
        if (sensor.sensor_id === 'PC-202') {
          newReading = Math.max(0.8, sensor.last_reading - 0.05);
          pressure = newReading;
          newStatus = newReading < 1.5 ? (newReading < 1.0 ? 'critical' : 'warning') : 'normal';
        }
      } else if (sensor.sensor_type === 'tank_level') {
        tank_level = Math.min(100, newReading);
        newReading = tank_level;
        if (newReading > 95) newStatus = 'critical';
        else if (newReading > 88) newStatus = 'warning';
      } else if (sensor.sensor_type === 'water_meter') {
        consumption = newReading;
      }

      insertReading.run(uuidv4(), sensor.id, flow, pressure, tank_level, consumption, new Date().toISOString());
      updateSensor.run(newReading, new Date().toISOString(), newStatus, sensor.id);

      // Check for alert conditions
      if (newStatus === 'critical' || newStatus === 'warning') {
        const existingAlert = db.prepare(`SELECT id FROM alerts WHERE sensor_id = ? AND status = 'active' AND created_at > datetime('now','-5 minutes')`).get(sensor.id);
        if (!existingAlert) {
          const alertMsg = sensor.sensor_type === 'pressure'
            ? `⚠️ Low pressure in Zone ${sensor.zone_id?.toUpperCase() || '?'}. Sensor ${sensor.sensor_id} reading ${newReading} bar.`
            : sensor.sensor_type === 'tank_level'
            ? `⚠️ Tank overflow risk. Sensor ${sensor.sensor_id} at ${newReading}%.`
            : `⚠️ Low flow rate on ${sensor.sensor_id}: ${newReading} L/min`;

          const alertId = uuidv4();
          db.prepare('INSERT INTO alerts (id,alert_type,zone_id,sensor_id,severity,status,message) VALUES (?,?,?,?,?,?,?)')
            .run(alertId, newStatus === 'critical' ? 'Critical Sensor Alert' : 'Sensor Warning', sensor.zone_id, sensor.id, newStatus === 'critical' ? 'critical' : 'high', 'active', alertMsg);

          if (!alertCreated) alertCreated = { id: alertId, message: alertMsg, severity: newStatus };

          // Notify all admins
          const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
          for (const admin of admins) {
            db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(uuidv4(), admin.id, '🚨 Demo Alert Triggered', alertMsg, 'alert');
          }
        }
      }

      updatedSensors.push({ ...sensor, last_reading: newReading, status: newStatus });
    }

    res.json({ sensors: updatedSensors, alert: alertCreated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const sensor = db.prepare('SELECT s.*, z.name as zone_name FROM sensors s LEFT JOIN zones z ON z.id = s.zone_id WHERE s.id = ?').get(req.params.id) as any;
    if (!sensor) { res.status(404).json({ error: 'Sensor not found' }); return; }
    res.json({ sensor });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sensors/:id/readings
router.get('/:id/readings', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const readings = db.prepare(`
      SELECT * FROM sensor_readings
      WHERE sensor_id = ? AND recorded_at >= datetime('now','-7 days')
      ORDER BY recorded_at ASC LIMIT 200
    `).all(req.params.id);
    res.json({ readings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
