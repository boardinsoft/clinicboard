'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard, SettingsCardFooter } from './SettingsCard';
import { updatePractitionerProfile } from '@/actions/settings';
import type { Tables } from '@/types/database.types';

const SPECIALTIES = [
  'Medicina General',
  'Pediatría',
  'Medicina Interna',
  'Cirugía General',
  'Ginecología y Obstetricia',
  'Cardiología',
  'Neurología',
  'Oncología',
  'Psiquiatría',
  'Dermatología',
  'Oftalmología',
  'Otorrinolaringología',
  'Ortopedia',
  'Urología',
  'Endocrinología',
  'Gastroenterología',
  'Neumología',
  'Reumatología',
  'Nefrología',
  'Medicina Familiar',
  'Medicina de Emergencia',
  'Anestesiología',
  'Radiología',
  'Patología',
  'Otra',
];

interface ProfileSettingsFormProps {
  profile: Tables<'practitioners'>;
}

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_given: (profile.name_given || []).join(' '),
    name_family: profile.name_family || '',
    national_id: profile.national_id || '',
    mpps_registration_number: profile.mpps_registration_number || '',
    specialty: profile.specialty || '',
    license_number: profile.license_number || '',
    university: profile.university || '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNameGivenChange = (value: string) => {
    setFormData(prev => ({ ...prev, name_given: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const nameGivenArray = formData.name_given.split(' ').filter(n => n.trim().length > 0);

    const result = await updatePractitionerProfile({
      name_given: nameGivenArray.length > 0 ? nameGivenArray : [''],
      name_family: formData.name_family,
      national_id: formData.national_id || undefined,
      mpps_registration_number: formData.mpps_registration_number || undefined,
      specialty: formData.specialty || undefined,
      license_number: formData.license_number || undefined,
      university: formData.university || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      const errorMsg = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
      toast.error('Error al guardar', { description: errorMsg });
      return;
    }

    toast.success('Perfil actualizado');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard
        title="Datos Profesionales"
        description="Información que aparece en tus recetas médicas (Art. 5 Gaceta 40.131)"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name_given" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
                Nombres <span className="text-s-danger">*</span>
              </Label>
              <Input
                id="name_given"
                value={formData.name_given}
                onChange={(e) => handleNameGivenChange(e.target.value)}
                placeholder="María Elena"
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name_family" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
                Apellidos <span className="text-s-danger">*</span>
              </Label>
              <Input
                id="name_family"
                value={formData.name_family}
                onChange={(e) => handleChange('name_family', e.target.value)}
                placeholder="González Pérez"
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="national_id" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Cédula de Identidad
            </Label>
            <Input
              id="national_id"
              value={formData.national_id}
              onChange={(e) => handleChange('national_id', e.target.value.toUpperCase())}
              placeholder="V-12345678"
              className="h-9 text-sm mono"
            />
            <p className="text-[10px] text-n-8">Formato: V-12345678 o E-12345678</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mpps_registration_number" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
                Registro MPPS <span className="text-s-danger">*</span>
              </Label>
              <Input
                id="mpps_registration_number"
                value={formData.mpps_registration_number}
                onChange={(e) => handleChange('mpps_registration_number', e.target.value)}
                placeholder="MPPS-12345"
                className="h-9 text-sm mono"
                required
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
                Número de Colegiación
              </Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => handleChange('license_number', e.target.value)}
                placeholder="CM-12345"
                className="h-9 text-sm mono"
                maxLength={50}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialty" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Especialidad
            </Label>
            <select
              id="specialty"
              value={formData.specialty}
              onChange={(e) => handleChange('specialty', e.target.value)}
              className="flex h-9 w-full rounded-md border border-n-5 bg-n-1 px-3 py-1 text-sm focus:outline-none focus:border-b-8 focus:ring-b-8/10"
            >
              <option value="">Seleccionar especialidad</option>
              {SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university" className="text-[11px] font-semibold text-n-10 uppercase tracking-wide">
              Universidad de Egreso
            </Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => handleChange('university', e.target.value)}
              placeholder="Universidad Central de Venezuela"
              className="h-9 text-sm"
              maxLength={200}
            />
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
          disabled={isLoading || !formData.name_family.trim() || formData.name_given.length === 0}
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
