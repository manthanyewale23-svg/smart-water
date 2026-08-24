import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { role, page = '1', limit = '20', search } = req.query as any;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let query = 'SELECT id,name,email,role,phone,is_active,created_at FROM users WHERE 1=1';
    const params: any[] = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const users = db.prepare(query).all(...params);
    const { total } = db.prepare(`SELECT COUNT(*) as total FROM users WHERE 1=1${role ? ' AND role=?' : ''}${search ? ' AND (name LIKE ? OR email LIKE ?)' : ''}`).get(...params.slice(0, -2)) as any;
    res.json({ users, total });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, authorize('admin'), (req: AuthRequest, res: Response): void => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password || !role) { res.status(400).json({ error: 'name, email, password, role required' }); return; }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) { res.status(409).json({ error: 'Email already exists' }); return; }
    const id = uuidv4();
    db.prepare('INSERT INTO users (id,name,email,password_hash,role,phone) VALUES (?,?,?,?,?,?)').run(id, name, email, bcrypt.hashSync(password, 10), role, phone || null);
    res.status(201).json({ user: { id, name, email, role, phone } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    if (req.user!.role !== 'admin' && req.user!.id !== req.params.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const user = db.prepare('SELECT id,name,email,role,phone,is_active,created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    if (req.user!.role !== 'admin' && req.user!.id !== req.params.id) { res.status(403).json({ error: 'Forbidden' }); return; }
    const { name, phone, is_active, password } = req.body;
    const updates: string[] = [];
    const params: any[] = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
    if (is_active !== undefined && req.user!.role === 'admin') { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (password) { updates.push('password_hash = ?'); params.push(bcrypt.hashSync(password, 10)); }
    if (updates.length > 0) { params.push(req.params.id); db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params); }
    const user = db.prepare('SELECT id,name,email,role,phone,is_active,created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ user });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
