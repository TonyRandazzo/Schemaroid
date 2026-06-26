import supabase from '../models/db.js';

export const getShapes = async (req, res) => {
  const { schemaId } = req.params;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', schemaId).single();
  if (!schema) return res.status(404).json({ error: 'Schema not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('shapes').select('*').eq('schema_id', schemaId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createShape = async (req, res) => {
  const { schemaId, title, description, color, x, y, width, height, hyperlink, image_url, shape_type } = req.body;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', schemaId).single();
  if (!schema) return res.status(404).json({ error: 'Schema not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('shapes').insert({
    schema_id: schemaId,
    title,
    description,
    color: color || '#3B82F6',
    x,
    y,
    width: width || 150,
    height: height || 100,
    hyperlink,
    image_url,
    shape_type: shape_type || 'rectangle'
  }).select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const updateShape = async (req, res) => {
  const { id } = req.params;
  const { data: shape } = await supabase.from('shapes').select('schema_id').eq('id', id).single();
  if (!shape) return res.status(404).json({ error: 'Shape not found' });
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', shape.schema_id).single();
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, color, x, y, width, height, hyperlink, image_url, shape_type } = req.body;
  const updates = Object.fromEntries(
    Object.entries({ title, description, color, x, y, width, height, hyperlink, image_url, shape_type })
      .filter(([, v]) => v !== undefined)
  );

  const { data, error } = await supabase.from('shapes').update(updates).eq('id', id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
};

export const deleteShape = async (req, res) => {
  const { id } = req.params;
  const { data: shape } = await supabase.from('shapes').select('schema_id').eq('id', id).single();
  if (!shape) return res.status(404).json({ error: 'Shape not found' });
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', shape.schema_id).single();
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { error } = await supabase.from('shapes').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};