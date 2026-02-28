'use client';

import React, { useState } from 'react';
import {
    Form,
    Stack,
    TextInput,
    Select,
    SelectItem,
    Button,
    Grid,
    Column,
    Tile,
    Breadcrumb,
    BreadcrumbItem,
    ToastNotification,
    TextArea,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useRouter } from 'next/navigation';
import { createPatient } from '@/actions/patients';

export default function NewPatientPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: string; title: string; subtitle: string } | null>(null);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setNotification(null);

        const formData = new FormData(event.currentTarget);
        const rawGivenNames = formData.get('givenNames')?.toString() || '';
        const givenNames = rawGivenNames.split(',').map(n => n.trim()).filter(n => n !== '');
        const familyName = formData.get('familyName')?.toString() || '';
        const gender = formData.get('gender')?.toString() || 'unknown';
        const phone = formData.get('phone')?.toString() || '';
        const email = formData.get('email')?.toString() || '';
        const documentId = formData.get('documentId')?.toString() || '';
        const address = formData.get('address')?.toString() || '';
        const birthDate = formData.get('birthDate')?.toString() || null;

        if (!familyName || givenNames.length === 0) {
            setNotification({ type: 'error', title: 'Error de validación', subtitle: 'Nombre y apellido son requeridos.' });
            setLoading(false);
            return;
        }

        try {
            const result = await createPatient({
                givenNames,
                familyName,
                gender,
                birthDate: birthDate,
                documentId,
                phone,
                email,
                address
            });

            if (result.error) {
                setNotification({
                    type: 'error',
                    title: 'Error al registrar',
                    subtitle: JSON.stringify(result.error) || 'Error al guardar el paciente.'
                });
                setLoading(false);
                return;
            }

            setNotification({
                type: 'success',
                title: 'Paciente registrado',
                subtitle: `El paciente ${familyName} ha sido creado exitosamente.`
            });

            if (result.data?.id) {
                setTimeout(() => router.push(`/patients/${result.data.id}`), 1500);
            } else {
                setTimeout(() => router.push('/patients'), 1500);
            }

        } catch (error: any) {
            console.error('Error creating patient:', error);
            setNotification({
                type: 'error',
                title: 'Error al registrar',
                subtitle: error.message || 'Ocurrió un error inesperado al intentar guardar.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section aria-label="Registro de Nuevo Paciente">
            <div className="page-header">
                <Breadcrumb noTrailingSlash style={{ marginBottom: '1rem' }}>
                    <BreadcrumbItem href="/patients" onClick={(e) => { e.preventDefault(); router.push('/patients'); }}>
                        Pacientes
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>Nuevo Paciente</BreadcrumbItem>
                </Breadcrumb>
                <h1 className="page-header__title">Alta de Paciente</h1>
                <p className="page-header__subtitle">Registro centralizado bajo estándar FHIR R4 Patient Resource.</p>
            </div>

            <Grid fullWidth className="content-padding">
                <Column lg={12} md={8} sm={4}>
                    <Tile className="form-tile">
                        <Form onSubmit={handleSubmit}>
                            <Stack gap={7}>
                                <div className="form-row">
                                    <TextInput
                                        id="givenNames"
                                        name="givenNames"
                                        labelText="Nombres"
                                        placeholder="Ej: María, Carmen (separados por coma)"
                                        required
                                    />
                                    <TextInput
                                        id="familyName"
                                        name="familyName"
                                        labelText="Apellidos"
                                        placeholder="Ej: García López"
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <Select id="gender" name="gender" labelText="Género" defaultValue="unknown" required>
                                        <SelectItem value="unknown" text="Seleccionar género" />
                                        <SelectItem value="female" text="Femenino" />
                                        <SelectItem value="male" text="Masculino" />
                                        <SelectItem value="other" text="Otro" />
                                    </Select>
                                    <TextInput
                                        id="birthDate"
                                        name="birthDate"
                                        type="date"
                                        labelText="Fecha de Nacimiento"
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="form-row">
                                    <TextInput
                                        id="documentId"
                                        name="documentId"
                                        labelText="Cédula / Documento de Identidad"
                                        placeholder="V-00000000"
                                    />
                                    <TextInput
                                        id="phone"
                                        name="phone"
                                        labelText="Teléfono"
                                        placeholder="+58 412-0000000"
                                    />
                                </div>

                                <TextInput
                                    id="email"
                                    name="email"
                                    type="email"
                                    labelText="Correo Electrónico"
                                    placeholder="correo@ejemplo.com"
                                />

                                <TextArea
                                    id="address"
                                    name="address"
                                    labelText="Dirección Personal"
                                    placeholder="Dirección completa del domicilio..."
                                />

                                <div className="form-actions">
                                    <Button kind="ghost" renderIcon={Close} onClick={() => router.push('/patients')}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" kind="primary" renderIcon={Save} disabled={loading}>
                                        {loading ? 'Guardando...' : 'Registrar Paciente'}
                                    </Button>
                                </div>
                            </Stack>
                        </Form>
                    </Tile>
                </Column>
            </Grid>

            {notification && (
                <div className="toast-container">
                    <ToastNotification
                        kind={notification.type as any}
                        title={notification.title}
                        subtitle={notification.subtitle}
                        timeout={5000}
                        onClose={() => setNotification(null)}
                    />
                </div>
            )}

            <style jsx>{`
                .content-padding {
                    padding: 0 1rem;
                }
                .form-tile {
                    padding: 2rem;
                }
            `}</style>
        </section>
    );
}
