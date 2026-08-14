import { useThemeStore } from '../../stores/themeStore';

function SunIcon() {
  return (
    <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-[15px] h-[15px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  );
}

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
      title={isDark ? 'Tema chiaro' : 'Tema scuro'}
      className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full
        border border-line bg-surface-sunken transition-colors hover:border-line-strong
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent
        focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${className}`}
    >
      <span className="pointer-events-none absolute left-[7px] text-fg-subtle">
        <SunIcon />
      </span>
      <span className="pointer-events-none absolute right-[7px] text-fg-subtle">
        <MoonIcon />
      </span>
      <span
        className={`pointer-events-none z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full
          bg-surface text-accent shadow-md shadow-[rgb(var(--shadow-color)/0.20)] ring-1 ring-line
          transition-transform duration-200 ease-out ${isDark ? 'translate-x-[31px]' : 'translate-x-[3px]'}`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}
