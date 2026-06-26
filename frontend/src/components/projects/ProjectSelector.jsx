import { useEffect } from 'react';
import Select from 'react-select';
import { useProjectStore } from '../../stores/projectStore';
import { useSchemaStore } from '../../stores/schemaStore';

export default function ProjectSelector() {
  const { projects, currentProjectId, fetchProjects, setCurrentProject } = useProjectStore();
  const { fetchSchemas } = useSchemaStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const options = projects.map(p => ({ value: p.id, label: p.name }));
  const current = options.find(o => o.value === currentProjectId);

  const handleChange = (opt) => {
    setCurrentProject(opt.value);
    fetchSchemas(opt.value);
  };

  return (
    <Select
      options={options}
      value={current}
      onChange={handleChange}
      placeholder="Seleziona progetto"
      className="w-64"
      isClearable={false}
    />
  );
}