import { Router } from 'express';
import { db } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { data, error } = await db.from('user_progress')
    .select('*').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

async function upsertProgress(userId, constellationId, field) {
  const existing = await db.from('user_progress')
    .select('*').eq('user_id', userId).eq('constellation_id', constellationId).single();
  if (existing.data) {
    return db.from('user_progress')
      .update({ [field]: true, [`${field}_at`]: new Date().toISOString() })
      .eq('id', existing.data.id);
  }
  return db.from('user_progress').insert({
    user_id: userId, constellation_id: constellationId,
    [field]: true, [`${field}_at`]: new Date().toISOString()
  });
}

router.post('/:id/discover', authenticate, async (req, res) => {
  const { error } = await upsertProgress(req.user.id, req.params.id, 'discovered');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post('/:id/draw', authenticate, async (req, res) => {
  const { error } = await upsertProgress(req.user.id, req.params.id, 'drawn');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.post('/:id/bookmark', authenticate, async (req, res) => {
  const existing = await db.from('user_progress')
    .select('*').eq('user_id', req.user.id).eq('constellation_id', req.params.id).single();
  if (existing.data) {
    await db.from('user_progress')
      .update({ bookmarked: !existing.data.bookmarked }).eq('id', existing.data.id);
  } else {
    await db.from('user_progress').insert({
      user_id: req.user.id, constellation_id: req.params.id, bookmarked: true
    });
  }
  res.json({ ok: true });
});

export default router;
