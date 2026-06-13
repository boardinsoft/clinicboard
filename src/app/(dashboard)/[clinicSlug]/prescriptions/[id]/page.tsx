import { notFound } from 'next/navigation';
import { getPrescriptionById, getPrescriptionAuditLog } from '@/actions/prescriptions';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentPractitionerId } from '@/lib/supabase/auth-utils';
import PrescriptionDetailClient from '@/components/prescriptions/PrescriptionDetailClient';

interface PageProps {
    params: Promise<{
        clinicSlug: string;
        id: string;
    }>;
}

export default async function PrescriptionDetailPage({ params }: PageProps) {
    const { clinicSlug, id } = await params;

    const supabase = await createServerSupabaseClient();
    const practitionerId = await getCurrentPractitionerId(supabase);

    if (!practitionerId) {
        notFound();
    }

    const { data: prescription } = await getPrescriptionById(id);

    if (!prescription) {
        notFound();
    }

    const { data: auditLog } = await getPrescriptionAuditLog(id);

    return (
        <PrescriptionDetailClient
            prescription={prescription as any}
            auditLog={(auditLog || []) as any}
            clinicSlug={clinicSlug}
        />
    );
}
