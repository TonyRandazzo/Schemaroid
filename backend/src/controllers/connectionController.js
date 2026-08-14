import supabase from '../models/db.js';
import { writeTolerant } from '../models/schemaCompat.js';

export const getConnections = async (req, res) => {
  const { schemaId } = req.params;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', schemaId).single();
  if (!schema) return res.status(404).json({ error: 'Schema not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await supabase.from('connections').select('*').eq('schema_id', schemaId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
};

export const createConnection = async (req, res) => {
  const { source_shape_id, target_shape_id, schemaId, label, source_handle, target_handle } = req.body;
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', schemaId).single();
  if (!schema) return res.status(404).json({ error: 'Schema not found' });
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await writeTolerant(
    (payload) => supabase.from('connections').insert(payload).select(),
    {
      source_shape_id,
      target_shape_id,
      schema_id: schemaId,
      label,
      source_handle,
      target_handle
    }
  );
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
};

export const deleteConnection = async (req, res) => {
  const { id } = req.params;
  const { data: conn } = await supabase.from('connections').select('schema_id').eq('id', id).single();
  if (!conn) return res.status(404).json({ error: 'Connection not found' });
  const { data: schema } = await supabase.from('schemas').select('project_id').eq('id', conn.schema_id).single();
  const { data: project } = await supabase.from('projects').select('user_id').eq('id', schema.project_id).single();
  if (!project || project.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { error } = await supabase.from('connections').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
};