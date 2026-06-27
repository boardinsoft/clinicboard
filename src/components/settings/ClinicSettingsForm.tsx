'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { notify } from '@/lib/notify';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard, SettingsCardFooter } from './SettingsCard';
import { updateClinic } from '@/actions/settings';
import type { Tables } from '@/types/database.types';

interface ClinicSettingsFormProps {
  clinic: Tables<'clinics'>;
  clinicSlug: string;
}

export function ClinicSettingsForm({ clinic, clinicSlug }: ClinicSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: clinic.name || '',
    rif: clinic.rif || '',
    address: clinic.address || '',
    phone: clinic.phone || '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const phoneNormalized = formData.phone.replace(/^\+?58/, '');

    const result = await updateClinic(clinic.id, {
      name: formData.name,
      rif: formData.rif || undefined,
      address: formData.address || undefined,
      phone: phoneNormalized || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      notify.error({ title: 'No se pudo guardar la configuración', description: 'Intenta de nuevo en unos momentos' });
      return;
    }

    notify.success({ title: 'Configuración guardada', description: 'Tus cambios ya están activos en el consultorio' });
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard
        title="Información de la Clínica"
        description="Datos de tu consultorio que aparecen en las recetas médicas"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Nombre de la Clínica <span className="text-s-danger">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Clínica Médica San José"
              className="h-9 text-sm"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rif" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              RIF
            </Label>
            <Input
              id="rif"
              value={formData.rif}
              onChange={(e) => handleChange('rif', e.target.value)}
              placeholder="J-12345678-9"
              className="h-9 text-sm mono"
            />
            <p className="text-[10px] text-n-8">Formato: J-12345678-9 ( Venezuela)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Dirección Fiscal
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Av. Libertador, Edif. Torre Médica, Piso 3, Oficina 3-A, Caracas"
              className="h-9 text-sm"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Teléfono
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-n-8">+58</span>
              <Input
                id="phone"
                value={formData.phone?.replace(/^\+?58/, '')}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="2121234567"
                className="h-9 text-sm pl-8 mono"
              />
            </div>
            <p className="text-[10px] text-n-8">10-11 dígitos sin prefijo +58</p>
          </div>
        </div>
      </SettingsCard>

      <SettingsCardFooter className="mt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 px-4"
          onClick={() => router.refresh()}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          className="h-9 px-4 bg-b-8 hover:bg-b-9 active:scale-95"
          disabled={isLoading || !formData.name.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </SettingsCardFooter>
    </form>
  );
}
