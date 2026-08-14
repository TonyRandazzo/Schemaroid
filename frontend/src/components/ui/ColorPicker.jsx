import { useRecentColorsStore } from '../../stores/recentColorsStore';

export default function ColorPicker({
  value,
  onChange,
  kind,
  badge,
  compact = false,
  title,
}) {
  const recent = useRecentColorsStore((s) => s.recent[kind] ?? []);

  const swatch = compact ? 'h-4 w-4' : 'h-6 w-6';
  const input = compact ? 'h-7 w-7' : 'h-10 w-16';

  return (
    <div className={compact ? 'flex items-center gap-1.5' : 'space-y-2'}>
      <label className="relative inline-block shrink-0 cursor-pointer" title={title}>
        {title && <span className="sr-only">{title}</span>}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${input} cursor-pointer rounded-md border border-line bg-transparent p-0`}
        />
        {badge && (
          <span
            className="pointer-events-none absolute inset-0 grid place-items-center text-[11px] font-bold"
            style={{ color: value, textShadow: '0 0 2px rgba(0,0,0,.55)' }}
          >
            {badge}
          </span>
        )}
      </label>

      {recent.length > 0 && (
        <div className={compact ? 'flex flex-wrap items-center gap-1' : 'flex flex-wrap items-center gap-1.5'}>
          {!compact && (
            <span className="mr-0.5 w-full text-xs text-fg-subtle">Usati di recente</span>
          )}
          {recent.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={`Usa ${c}`}
              onClick={() => onChange(c)}
              className={`${swatch} nodrag shrink-0 rounded border transition-transform hover:scale-110 ${
                value?.toUpperCase() === c ? 'border-accent ring-2 ring-accent/30' : 'border-line'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
