import { Router } from 'express';
import { db } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  let query = db.from('constellations').select('*');
  if (req.query.visible === 'true' && req.query.lat) {
    const hemisphere = parseFloat(req.query.lat) >= 0 ? 'N' : 'S';
    query = query.overlaps('visibility_hemispheres', [hemisphere]);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await db.from('constellations').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.get('/:id/stars', async (req, res) => {
  const { data, error } = await db.from('constellations')
    .select('id, stars_data, connections, name')
    .eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

export default router;
