import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// GET /api/complaints
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { status, zone_id, priority, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT c.*, u.name as citizen_name, z.name as zone_name,
        w.name as assigned_worker_name
      FROM complaints c
      LEFT JOIN users u ON u.id = c.citizen_id
      LEFT JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users w ON w.id = c.assigned_worker_id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Citizens only see their own
    if (req.user!.role === 'citizen') {
      query += ' AND c.citizen_id = ?';
      params.push(req.user!.id);
    }
    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (zone_id) { query += ' AND c.zone_id = ?'; params.push(zone_id); }
    if (priority) { query += ' AND c.priority = ?'; params.push(priority); }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const complaints = db.prepare(query).all(...params);
    const countQuery = `SELECT COUNT(*) as total FROM complaints WHERE 1=1${req.user!.role === 'citizen' ? ' AND citizen_id = ?' : ''}${status ? ' AND status = ?' : ''}${zone_id ? ' AND zone_id = ?' : ''}${priority ? ' AND priority = ?' : ''}`;
    const countParams: any[] = [];
    if (req.user!.role === 'citizen') countParams.push(req.user!.id);
    if (status) countParams.push(status);
    if (zone_id) countParams.push(zone_id);
    if (priority) countParams.push(priority);
    const { total } = db.prepare(countQuery).get(...countParams) as any;

    res.json({ complaints, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/complaints
router.post('/', authenticate, upload.single('photo'), (req: AuthRequest, res: Response): void => {
  try {
    const { problem_type, description, latitude, longitude, priority = 'medium', zone_id } = req.body;
    if (!problem_type || !description) {
      res.status(400).json({ error: 'problem_type and description are required' });
      return;
    }
    const id = uuidv4();
    const photo_url = req.file ? `/uploads/${req.file.filename}` : null;

    db.prepare(`
      INSERT INTO complaints (id,citizen_id,problem_type,description,latitude,longitude,photo_url,priority,zone_id)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(id, req.user!.id, problem_type, description, latitude || null, longitude || null, photo_url, priority, zone_id || null);

    // Notify admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
    const problemLabel = problem_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    for (const admin of admins) {
      db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
        uuidv4(), admin.id,
        'New Complaint Reported',
        `${req.user!.name} reported ${problemLabel}. Priority: ${priority.toUpperCase()}`,
        'complaint'
      );
    }

    const complaint = db.prepare('SELECT c.*, u.name as citizen_name FROM complaints c LEFT JOIN users u ON u.id = c.citizen_id WHERE c.id = ?').get(id);
    res.status(201).json({ complaint });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const complaint = db.prepare(`
      SELECT c.*, u.name as citizen_name, z.name as zone_name, w.name as assigned_worker_name
      FROM complaints c
      LEFT JOIN users u ON u.id = c.citizen_id
      LEFT JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users w ON w.id = c.assigned_worker_id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!complaint) { res.status(404).json({ error: 'Complaint not found' }); return; }
    res.json({ complaint });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/complaints/:id
router.patch('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { status, assigned_worker_id, zone_id, priority } = req.body;
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(req.params.id) as any;
    if (!complaint) { res.status(404).json({ error: 'Complaint not found' }); return; }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (assigned_worker_id !== undefined) { updates.push('assigned_worker_id = ?'); params.push(assigned_worker_id || null); }
    if (zone_id) { updates.push('zone_id = ?'); params.push(zone_id); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    if (updates.length > 1) {
      db.prepare(`UPDATE complaints SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    // Notify citizen on status change
    if (status && complaint.citizen_id) {
      const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
        uuidv4(), complaint.citizen_id,
        'Complaint Status Updated',
        `Your complaint has been updated to: ${statusLabel}`,
        'complaint'
      );
    }

    // Notify worker if assigned
    if (assigned_worker_id) {
      const problemLabel = complaint.problem_type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
        uuidv4(), assigned_worker_id,
        'Complaint Assigned to You',
        `You have been assigned complaint: ${problemLabel} (Priority: ${complaint.priority.toUpperCase()})`,
        'task'
      );
    }

    const updated = db.prepare('SELECT c.*, u.name as citizen_name, z.name as zone_name, w.name as assigned_worker_name FROM complaints c LEFT JOIN users u ON u.id = c.citizen_id LEFT JOIN zones z ON z.id = c.zone_id LEFT JOIN users w ON w.id = c.assigned_worker_id WHERE c.id = ?').get(req.params.id);
    res.json({ complaint: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
