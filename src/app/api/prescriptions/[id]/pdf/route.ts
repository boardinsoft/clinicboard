import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import PrescriptionPDFDocument from '@/components/prescriptions/PrescriptionPDFDocument';
import {
    getPrescriptionForPrint,
    markPrescriptionPrinted,
} from '@/actions/prescriptions';
import {
    validatePrescriptionForPrint,
    type PrescriptionForPrint,
} from '@/lib/ve-prescription';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function sanitizeForFilename(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
}

function buildPrescriptionFilename(prescription: PrescriptionForPrint): string {
    const patient = prescription.patient;
    const date = prescription.authored_on
        ? new Date(prescription.authored_on).toISOString().split('T')[0]
        : 'sin-fecha';

    if (patient) {
        const familyName = sanitizeForFilename(patient.name_family || '');
        const givenNames = sanitizeForFilename((patient.name_given || []).join('-') || '');
        return `receta-${familyName}-${givenNames}-${date}.pdf`;
    }

    return `receta-${date}.pdf`;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await getPrescriptionForPrint(id);

        if (result.error || !result.data) {
            return NextResponse.json(
                { error: result.error || 'Receta no encontrada' },
                { status: 404 }
            );
        }

        const prescription = result.data as unknown as PrescriptionForPrint;
        const errors = validatePrescriptionForPrint(prescription);

        if (errors.length > 0) {
            return NextResponse.json(
                { error: 'Datos incompletos para impresión', validation_errors: errors },
                { status: 400 }
            );
        }

        const markResult = await markPrescriptionPrinted(id);
        if (markResult.error) {
            console.warn('No se pudo registrar impresión:', markResult.error);
        }

        const document = React.createElement(PrescriptionPDFDocument, { prescription });
        const stream = await renderToStream(document as any);
        const filename = buildPrescriptionFilename(prescription);

        return new NextResponse(stream as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Pdf-Generated': 'true',
            },
        });
    } catch (error) {
        console.error('Error generando PDF:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        return NextResponse.json(
            { error: 'Error interno al generar el PDF', details: errorMessage, stack: errorStack },
            { status: 500 }
        );
    }
}