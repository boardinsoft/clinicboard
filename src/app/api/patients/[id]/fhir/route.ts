import { NextRequest, NextResponse } from 'next/server';
import { getPatientFullHistory } from '@/actions/patients';
import { buildFHIRBundle } from '@/lib/fhir/bundle-builder';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch all patient history
        const result = await getPatientFullHistory(id);

        if (result.error) {
            return NextResponse.json(
                { error: result.error },
                { status: 403 }
            );
        }

        if (!result.data) {
            return NextResponse.json(
                { error: 'No se encontró historia para este paciente' },
                { status: 404 }
            );
        }

        // Build FHIR R4 Bundle
        const bundle = buildFHIRBundle(result.data);

        // Return as FHIR JSON with proper content type
        return new NextResponse(JSON.stringify(bundle, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/fhir+json; charset=utf-8',
                'Content-Disposition': `attachment; filename="patient-${id}-fhir-bundle.json"`,
            },
        });
    } catch (error) {
        console.error('Error in FHIR export:', error);
        return NextResponse.json(
            { error: 'Error interno al generar la historia FHIR' },
            { status: 500 }
        );
    }
}
