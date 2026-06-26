import supabase from '../models/db.js';
import { v4 as uuidv4 } from 'uuid';

export const uploadImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const file = req.file;
  const ext = file.originalname.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) return res.status(500).json({ error: error.message });
  const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
  res.json({ url: urlData.publicUrl });
};