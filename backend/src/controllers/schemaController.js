import supabase from '../models/db.js';

export const getSchemas = async (req, res) => {
  const { projectId } = req.params;
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('schemas').select('*').eq('project_id', projectId).order('position', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createSchema = async (req, res) => {
  const { projectId, name } = req.body;
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', projectId).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('schemas').insert({ project_id: projectId, name }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const updateSchema = async (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', id).single();
  if (!schema) return res.status(404).json({ error: 'Not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (position !== undefined) updates.position = position;
  const { data, error } = await supabase.from('schemas').update(updates).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteSchema = async (req, res) => {
  const { id } = req.params;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', id).single();
  if (!schema) return res.status(404).json({ error: 'Not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { error } = await supabase.from('schemas').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};