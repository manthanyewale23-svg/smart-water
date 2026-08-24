import { Router, Response } from 'express';
import db from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user!.id);
    res.json({ notifications: notifs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/count', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    const { unread_count } = db.prepare("SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND read = 0").get(req.user!.id) as any;
    res.json({ unread_count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/read-all', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE user_id = ?").run(req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/read', authenticate, (req: AuthRequest, res: Response): void => {
  try {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
