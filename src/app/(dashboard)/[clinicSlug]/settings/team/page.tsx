import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getPractitionerClinics } from '@/lib/supabase/clinic-utils';
import { getClinicTeam } from '@/actions/settings';
import { SettingsCard } from '@/components/settings/SettingsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ clinicSlug: string }>;
}) {
  const { clinicSlug } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: practitioner } = await supabase
    .from('practitioners')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!practitioner) {
    notFound();
  }

  const clinics = await getPractitionerClinics(supabase, practitioner.id);
  const clinic = clinics.find(c => c.slug === clinicSlug);

  if (!clinic) {
    notFound();
  }

  const { data: teamData, error } = await getClinicTeam(clinic.id);

  if (error || !teamData) {
    notFound();
  }

  const getRoleBadge = (role: string | null, isOwner: boolean | null) => {
    if (isOwner) {
      return <Badge variant="pill-info" className="text-[10px]">Propietario</Badge>;
    }
    if (role === 'admin') {
      return <Badge variant="pill-neutral" className="text-[10px]">Admin</Badge>;
    }
    if (role === 'member') {
      return <Badge variant="pill-neutral" className="text-[10px]">Miembro</Badge>;
    }
    return <Badge variant="pill-neutral" className="text-[10px]">—</Badge>;
  };

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Equipo del Consultorio"
        description="Miembros que tienen acceso a este consultorio"
      >
        <div className="space-y-4">
          {teamData.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-n-6 mx-auto mb-3" />
              <p className="text-sm text-n-8">No hay miembros en este consultorio</p>
            </div>
          ) : (
            <div className="border border-n-5/30 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-n-2 border-b border-n-5/30">
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-n-8 uppercase tracking-wide">Nombre</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-n-8 uppercase tracking-wide">Cédula</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-n-8 uppercase tracking-wide">Rol</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-n-8 uppercase tracking-wide">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-n-5/20">
                  {teamData.map((member) => {
                    const prac = member.practitioner as any;
                    const fullName = prac
                      ? `${prac.name_family}, ${(prac.name_given || []).join(' ')}`
                      : '—';
                    return (
                      <tr key={member.id} className="hover:bg-n-2/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-n-11">{fullName}</p>
                            {prac?.specialty && (
                              <p className="text-[11px] text-n-8">{prac.specialty}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] mono text-n-8">
                            {prac?.national_id || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {getRoleBadge(member.role, member.is_owner)}
                        </td>
                        <td className="px-4 py-3">
                          {member.active ? (
                            <Badge variant="pill-success" className="text-[10px]">Activo</Badge>
                          ) : (
                            <Badge variant="pill-danger" className="text-[10px]">Inactivo</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-4 border-t border-n-5/30">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4"
              disabled
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Invitar miembro
            </Button>
            <p className="text-[10px] text-n-8 mt-2">
              La invitación de miembros estará disponible próximamente
            </p>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
