import supabase from '../models/db.js';

export const getProjects = async (req, res) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createProject = async (req, res) => {
  const { name } = req.body;
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: req.user.id, name })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('projects').update({ name, updated_at: new Date() }).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteProject = async (req, res) => {
  const { id } = req.params;
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};