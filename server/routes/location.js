import { Router } from 'express';
import { db } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.put('/location', authenticate, async (req, res) => {
  const { lat, lng } = req.body;
  const { error } = await db.from('users')
    .update({ location_lat: lat, location_lng: lng }).eq('id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
