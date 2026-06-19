import { Router } from 'express';
import { db } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/constellations/:constellationId/comments', async (req, res) => {
  const { data, error } = await db.from('comments')
    .select('*, users(username)')
    .eq('constellation_id', req.params.constellationId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/constellations/:constellationId/comments', authenticate, async (req, res) => {
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Body required' });
  const { data, error } = await db.from('comments').insert({
    user_id: req.user.id, constellation_id: req.params.constellationId, body
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete('/comments/:id', authenticate, async (req, res) => {
  const { error } = await db.from('comments')
    .delete().eq('id', req.params.id).eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
