import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// GET /api/maintenance
router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { status, zone_id, worker_id, page = '1', limit = '20' } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT m.*, w.name as worker_name, z.name as zone_name, c.problem_type
      FROM maintenance_tasks m
      LEFT JOIN users w ON w.id = m.worker_id
      LEFT JOIN zones z ON z.id = m.zone_id
      LEFT JOIN complaints c ON c.id = m.complaint_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (req.user!.role === 'worker') { query += ' AND m.worker_id = ?'; params.push(req.user!.id); }
    if (status) { query += ' AND m.status = ?'; params.push(status); }
    if (zone_id) { query += ' AND m.zone_id = ?'; params.push(zone_id); }
    if (worker_id) { query += ' AND m.worker_id = ?'; params.push(worker_id); }
    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const tasks = db.prepare(query).all(...params);
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/maintenance
router.post('/', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { complaint_id, worker_id, priority = 'medium', due_date, title, description, zone_id } = req.body;
    if (!worker_id || !title) { res.status(400).json({ error: 'worker_id and title are required' }); return; }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO maintenance_tasks (id,complaint_id,worker_id,priority,due_date,title,description,zone_id)
      VALUES (?,?,?,?,?,?,?,?)
    `).run(id, complaint_id || null, worker_id, priority, due_date || null, title, description || null, zone_id || null);

    // Update complaint status to assigned if complaint_id given
    if (complaint_id) {
      db.prepare("UPDATE complaints SET status = 'assigned', assigned_worker_id = ?, updated_at = ? WHERE id = ?")
        .run(worker_id, new Date().toISOString(), complaint_id);
    }

    // Notify worker
    db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
      uuidv4(), worker_id, 'New Task Assigned', `You have been assigned: ${title} (Priority: ${priority.toUpperCase()})`, 'task'
    );

    const task = db.prepare('SELECT m.*, w.name as worker_name, z.name as zone_name FROM maintenance_tasks m LEFT JOIN users w ON w.id = m.worker_id LEFT JOIN zones z ON z.id = m.zone_id WHERE m.id = ?').get(id);
    res.status(201).json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/maintenance/:id
router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const task = db.prepare(`
      SELECT m.*, w.name as worker_name, z.name as zone_name, c.problem_type, c.description as complaint_description
      FROM maintenance_tasks m
      LEFT JOIN users w ON w.id = m.worker_id
      LEFT JOIN zones z ON z.id = m.zone_id
      LEFT JOIN complaints c ON c.id = m.complaint_id
      WHERE m.id = ?
    `).get(req.params.id);
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/maintenance/:id
router.patch('/:id', authenticate, upload.fields([{ name: 'before_photo', maxCount: 1 }, { name: 'after_photo', maxCount: 1 }]), (req: AuthRequest, res: Response): void => {
  try {
    const task = db.prepare('SELECT * FROM maintenance_tasks WHERE id = ?').get(req.params.id) as any;
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    // Workers can only update their own tasks
    if (req.user!.role === 'worker' && task.worker_id !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to update this task' }); return;
    }

    const { status, notes, worker_id, priority, due_date } = req.body;
    const files = req.files as any;
    const updates: string[] = [];
    const params: any[] = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
    if (worker_id) { updates.push('worker_id = ?'); params.push(worker_id); }
    if (priority) { updates.push('priority = ?'); params.push(priority); }
    if (due_date) { updates.push('due_date = ?'); params.push(due_date); }
    if (files?.before_photo?.[0]) { updates.push('before_photo = ?'); params.push(`/uploads/${files.before_photo[0].filename}`); }
    if (files?.after_photo?.[0]) { updates.push('after_photo = ?'); params.push(`/uploads/${files.after_photo[0].filename}`); }

    if (status === 'completed') {
      updates.push('completed_at = ?');
      params.push(new Date().toISOString());

      // Update related complaint to resolved
      if (task.complaint_id) {
        db.prepare("UPDATE complaints SET status = 'resolved', updated_at = ? WHERE id = ?")
          .run(new Date().toISOString(), task.complaint_id);
        const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(task.complaint_id) as any;
        if (complaint?.citizen_id) {
          db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
            uuidv4(), complaint.citizen_id, 'Complaint Resolved! ✅',
            `Your complaint has been resolved by our maintenance team. Task: ${task.title}`, 'complaint'
          );
        }
      }
      // Notify admins
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
      for (const admin of admins) {
        db.prepare('INSERT INTO notifications (id,user_id,title,message,type) VALUES (?,?,?,?,?)').run(
          uuidv4(), admin.id, 'Task Completed', `${task.title} has been marked as completed.`, 'maintenance'
        );
      }
    }

    if (updates.length > 0) {
      params.push(req.params.id);
      db.prepare(`UPDATE maintenance_tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = db.prepare('SELECT m.*, w.name as worker_name, z.name as zone_name FROM maintenance_tasks m LEFT JOIN users w ON w.id = m.worker_id LEFT JOIN zones z ON z.id = m.zone_id WHERE m.id = ?').get(req.params.id);
    res.json({ task: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
