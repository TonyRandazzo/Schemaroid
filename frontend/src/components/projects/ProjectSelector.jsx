import { useEffect } from 'react';
import Select from 'react-select';
import { useProjectStore } from '../../stores/projectStore';
import { useSchemaStore } from '../../stores/schemaStore';

const classNames = {
  control: ({ isFocused }) =>
    `!min-h-0 rounded-lg border bg-surface px-2.5 py-1.5 text-sm cursor-pointer transition-colors ${
      isFocused ? 'border-accent ring-2 ring-accent/20' : 'border-line hover:border-line-strong'
    }`,
  valueContainer: () => 'gap-1',
  singleValue: () => 'text-fg',
  input: () => 'text-fg',
  placeholder: () => 'text-fg-subtle',
  indicatorsContainer: () => 'gap-1 pl-1',
  dropdownIndicator: () => 'text-fg-subtle',
  menu: () => 'menu mt-1.5 overflow-hidden',
  menuList: () => 'max-h-60 overflow-y-auto',
  option: ({ isSelected, isFocused }) =>
    `px-3.5 py-2 text-sm cursor-pointer transition-colors ${
      isSelected
        ? 'bg-accent text-accent-fg font-medium'
        : isFocused
          ? 'bg-surface-hover text-fg'
          : 'text-fg-muted'
    }`,
  noOptionsMessage: () => 'px-3.5 py-2 text-sm text-fg-subtle',
};

function DropdownIndicator() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ProjectSelector() {
  const { projects, currentProjectId, fetchProjects, setCurrentProject } = useProjectStore();
  const { fetchSchemas, setCurrentSchema } = useSchemaStore();

  useEffect(() => {
    fetchProjects();
  }, []);

  const options = projects.map(p => ({ value: p.id, label: p.name }));
  const current = options.find(o => o.value === currentProjectId);

  const handleChange = (opt) => {
    setCurrentProject(opt.value);
    setCurrentSchema(null);
    fetchSchemas(opt.value);
  };

  return (
    <Select
      unstyled
      options={options}
      value={current ?? null}
      onChange={handleChange}
      placeholder="Seleziona progetto"
      className="w-56"
      isClearable={false}
      classNames={classNames}
      components={{ IndicatorSeparator: null, DropdownIndicator }}
      noOptionsMessage={() => 'Nessun progetto'}
    />
  );
}
