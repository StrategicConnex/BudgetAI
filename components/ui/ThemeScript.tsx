// D8: Prevent flash of wrong theme (FOUC).
// This inline script runs before React hydrates.
export default function ThemeScript() {
  const script = `(
    function() {
      try {
        var theme = localStorage.getItem('budgetai-theme') || 'system';
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', isDark);
        document.documentElement.classList.toggle('light', !isDark);
      } catch(e) {}
    }
  )();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
