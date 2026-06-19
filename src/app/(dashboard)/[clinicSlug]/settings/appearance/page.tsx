import React from 'react';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Apariencia"
        description="Personaliza cómo se ve ClinicBoard"
      >
        <div className="space-y-4">
          <Label className="text-[11px] font-semibold text-n-10 uppercase tracking-wide block mb-3">
            Tema
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border transition-all',
                    isActive
                      ? 'border-b-8 bg-b-1/50 text-b-8'
                      : 'border-n-5/30 hover:border-n-5 text-n-8 hover:text-n-11'
                  )}
                >
                  <Icon size={20} strokeWidth={1.8} />
                  <span className="text-[11px] font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
