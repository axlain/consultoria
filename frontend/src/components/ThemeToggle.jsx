import { useTheme } from '../context/ThemeContext'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

// Compact icon button — for sidebars / top bars that already provide their
// own spacing and hover chrome around it.
export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={className}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

// Full-width labeled row — for nav drawers/lists, matching the app's existing
// NAV_LINK_CLASS-style rows. Caller controls the row chrome via className.
export function ThemeToggleRow({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button type="button" onClick={toggleTheme} className={className}>
      <span className="flex items-center gap-2">
        {isDark ? <SunIcon /> : <MoonIcon />}
        {isDark ? 'Modo claro' : 'Modo oscuro'}
      </span>
    </button>
  )
}
