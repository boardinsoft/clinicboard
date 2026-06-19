import React from 'react';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-8 py-6 border-b border-n-5/30 bg-n-1">
        <h1 className="text-lg font-bold text-n-11">Configuración</h1>
        <p className="text-[11px] text-n-8 mt-0.5">
          Gestiona la información de tu consultorio y preferencias de cuenta
        </p>
      </div>
      <div className="flex-1 flex min-h-0">
        <SettingsSidebar clinicSlug={clinicSlug} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
