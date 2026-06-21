import { Router } from 'express';
import { db } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/badges', async (req, res) => {
  const { data, error } = await db.from('constellations')
    .select('id, name, iau_code, discovery_badge_url, discovery_badge_caption, mastery_badge_url, mastery_badge_caption');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/badges/user', authenticate, async (req, res) => {
  const { data, error } = await db.from('user_progress')
    .select('constellation_id, discovered, drawn').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  const badges = {};
  for (const p of data) badges[p.constellation_id] = { discovered: p.discovered, drawn: p.drawn };
  res.json(badges);
});

router.get('/milestones', async (req, res) => {
  const { data, error } = await db.from('milestone_achievements').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/milestones/user', authenticate, async (req, res) => {
  const { data, error } = await db.from('user_milestones')
    .select('milestone_id').eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(m => m.milestone_id));
});

export default router;
