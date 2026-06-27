import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { authenticate, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { username, email, password, is_expert } = req.body;
  const userEmail = email || `${username}@magellanic.app`;
  const hash = await bcrypt.hash(password, 10);
  const { data, error } = await db.from('users').insert({
    username, email: userEmail, password_hash: hash, is_expert: is_expert ?? false
  }).select().single();
  if (error) return res.status(400).json({ error: error.message });
  const token = jwt.sign({ id: data.id, username: data.username }, JWT_SECRET);
  const { password_hash, ...safe } = data;
  res.json({ user: safe, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { data: byEmail, error: emailErr } = await db.from('users').select('*').eq('email', email);
  if (!emailErr && byEmail?.length) {
    const user = byEmail[0];
    if (await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
      const { password_hash, ...safe } = user;
      return res.json({ user: safe, token });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { data: byUsername, error: userErr } = await db.from('users').select('*').eq('username', email);
  if (userErr || !byUsername?.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = byUsername[0];
  if (!(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
  const { password_hash, ...safe } = user;
  res.json({ user: safe, token });
});

router.get('/me', authenticate, async (req, res) => {
  const { data, error } = await db.from('users').select('*').eq('id', req.user.id).single();
  if (error) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safe } = data;
  res.json(safe);
});

export default router;
