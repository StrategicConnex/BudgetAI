'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

const themes = [
  { value: 'dark', icon: Moon, label: 'Oscuro' },
  { value: 'light', icon: Sun, label: 'Claro' },
  { value: 'system', icon: Monitor, label: 'Sistema' },
];

export default function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[34px] w-[100px] rounded-lg bg-secondary/60 border border-border" />;
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/60 border border-border">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-1.5 rounded-md transition-all duration-150 ${
            theme === value
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
}
