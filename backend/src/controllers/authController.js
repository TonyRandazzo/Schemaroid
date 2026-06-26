import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../models/db.js';

export const register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const { data: existing } = await supabase.from('users').select('id').eq('username', username);
  if (existing.length) return res.status(409).json({ error: 'Username taken' });
  const hashed = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ username, password_hash: hashed, is_guest: false })
    .select('id, username');
  if (error) return res.status(500).json({ error: error.message });
  const token = jwt.sign({ id: data[0].id, username: data[0].username, is_guest: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: data[0] });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const { data: users } = await supabase.from('users').select('*').eq('username', username);
  if (!users.length) return res.status(401).json({ error: 'Invalid credentials' });
  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, is_guest: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
};

export const guestLogin = async (req, res) => {
  const { guestId } = req.body;
  if (!guestId) return res.status(400).json({ error: 'guestId required' });
  let { data: existing } = await supabase.from('users').select('*').eq('guest_id', guestId).eq('is_guest', true);
  if (!existing || existing.length === 0) {
    const { data, error } = await supabase
      .from('users')
      .insert({ username: `guest_${guestId}`, is_guest: true, guest_id: guestId, password_hash: '' })
      .select('id, username');
    if (error) return res.status(500).json({ error: error.message });
    existing = data;
  }
  const user = existing[0];
  const token = jwt.sign({ id: user.id, username: user.username, is_guest: true }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username } });
};

export const updateProfile = async (req, res) => {
  const { username, password } = req.body;
  const userId = req.user.id;
  if (req.user.is_guest) return res.status(403).json({ error: 'Guest cannot update profile' });
  const updates = {};
  if (username) {
    const { data: existing } = await supabase.from('users').select('id').eq('username', username).neq('id', userId);
    if (existing.length) return res.status(409).json({ error: 'Username taken' });
    updates.username = username;
  }
  if (password) {
    updates.password_hash = await bcrypt.hash(password, 10);
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select('id, username');
  if (error) return res.status(500).json({ error: error.message });
  const newToken = jwt.sign({ id: data[0].id, username: data[0].username, is_guest: false }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token: newToken, user: data[0] });
};