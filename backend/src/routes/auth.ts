import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'smartwater_jwt_secret';

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email and password are required' });
      return;
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id,name,email,password_hash,role,phone) VALUES (?,?,?,?,?,?)').run(id, name, email, hash, 'citizen', phone || null);
    const token = jwt.sign({ id, email, role: 'citizen', name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, name, email, role: 'citizen', phone } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const user = db.prepare('SELECT id,name,email,role,phone,avatar_url,created_at FROM users WHERE id = ?').get(req.user!.id) as any;
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
