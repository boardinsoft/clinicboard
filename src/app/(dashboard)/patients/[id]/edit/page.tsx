'use client';

import React, { useState, useEffect } from 'react';
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
    Loading,
} from '@carbon/react';
import { Save, Close } from '@carbon/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { updatePatient } from '@/actions/patients';

export default function EditPatientPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: string; title: string; subtitle: string } | null>(null);

    // Form states
    const [patientData, setPatientData] = useState({
        givenNames: '',
        familyName: '',
        gender: 'unknown',
        birthDate: '',
        documentId: '',
        phone: '',
        email: '',
        address: '',
    });

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const { data, error } = await supabase
                    .from('patients')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                if (data) {
                    setPatientData({
                        givenNames: data.name_given?.join(', ') || '',
                        familyName: data.name_family || '',
                        gender: data.gender || 'unknown',
                        birthDate: data.birth_date || '',
                        documentId: (data.identifiers as any)?.[0]?.value || '',
                        phone: (data.telecom as any)?.find((t: any) => t.system === 'phone')?.value || '',
                        email: (data.telecom as any)?.find((t: any) => t.system === 'email')?.value || '',
                        address: (data.address as any)?.[0]?.text || '',
                    });
                }
            } catch (error: any) {
                console.error('Error fetching patient:', error);
                setNotification({
                    type: 'error',
                    title: 'Error al cargar',
                    subtitle: error.message || 'No se pudo cargar la información del paciente.'
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchPatient();
    }, [id, supabase]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setNotification(null);

        const givenNamesArr = patientData.givenNames.split(',').map(n => n.trim()).filter(n => n !== '');

        if (!patientData.familyName || givenNamesArr.length === 0) {
            setNotification({ type: 'error', title: 'Error de validación', subtitle: 'Nombre y apellido son requeridos.' });
            setSaving(false);
            return;
        }

        try {
            await updatePatient(id as string, {
                givenNames: givenNamesArr,
                familyName: patientData.familyName,
                gender: patientData.gender,
                birthDate: patientData.birthDate || null,
                documentId: patientData.documentId,
                phone: patientData.phone,
                email: patientData.email,
                address: patientData.address,
            });

            setNotification({
                type: 'success',
                title: 'Paciente actualizado',
                subtitle: 'Los cambios han sido guardados exitosamente.'
            });

            setTimeout(() => router.push(`/patients/${id}`), 1500);

        } catch (error: any) {
            console.error('Error updating patient:', error);
            setNotification({
                type: 'error',
                title: 'Error al guardar',
                subtitle: error.message || 'Ocurrió un error inesperado.'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <Breadcrumb noTrailingSlash>
                    <BreadcrumbItem onClick={() => router.push('/patients')}>Pacientes</BreadcrumbItem>
                    <BreadcrumbItem onClick={() => router.push(`/patients/${id}`)}>
                        {patientData.familyName}
                    </BreadcrumbItem>
                    <BreadcrumbItem isCurrentPage>Editar</BreadcrumbItem>
                </Breadcrumb>
                <h1 className="page-header__title">Editar Paciente</h1>
                <p className="page-header__subtitle">Modifica la información cumpliendo con FHIR R4.</p>
            </div>

            <Grid style={{ padding: '0 1rem' }}>
                <Column lg={12} md={8} sm={4}>
                    <Tile>
                        <Form onSubmit={handleSubmit}>
                            <Stack gap={7}>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <TextInput
                                        id="givenNames"
                                        labelText="Nombres"
                                        value={patientData.givenNames}
                                        onChange={(e) => setPatientData({ ...patientData, givenNames: e.target.value })}
                                        placeholder="Ej: María, Carmen"
                                        required
                                    />
                                    <TextInput
                                        id="familyName"
                                        labelText="Apellidos"
                                        value={patientData.familyName}
                                        onChange={(e) => setPatientData({ ...patientData, familyName: e.target.value })}
                                        placeholder="Ej: García López"
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Select
                                        id="gender"
                                        labelText="Género"
                                        value={patientData.gender}
                                        onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                        required
                                    >
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
                                        value={patientData.birthDate}
                                        onChange={(e) => setPatientData({ ...patientData, birthDate: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <TextInput
                                        id="documentId"
                                        labelText="Cédula / Identidad"
                                        value={patientData.documentId}
                                        onChange={(e) => setPatientData({ ...patientData, documentId: e.target.value })}
                                        placeholder="V-00000000"
                                    />
                                    <TextInput
                                        id="phone"
                                        labelText="Teléfono"
                                        value={patientData.phone}
                                        onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                                        placeholder="+58 412..."
                                    />
                                </div>

                                <TextInput
                                    id="email"
                                    type="email"
                                    labelText="Correo Electrónico"
                                    value={patientData.email}
                                    onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                                    placeholder="correo@ejemplo.com"
                                />

                                <TextArea
                                    id="address"
                                    labelText="Dirección Personal"
                                    value={patientData.address}
                                    onChange={(e) => setPatientData({ ...patientData, address: e.target.value })}
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button kind="ghost" renderIcon={Close} onClick={() => router.push(`/patients/${id}`)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" kind="primary" renderIcon={Save} disabled={saving}>
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </Button>
                                </div>
                            </Stack>
                        </Form>
                    </Tile>
                </Column>
            </Grid>

            {notification && (
                <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999 }}>
                    <ToastNotification
                        kind={notification.type as any}
                        title={notification.title}
                        subtitle={notification.subtitle}
                        timeout={5000}
                        onClose={() => setNotification(null)}
                    />
                </div>
            )}
        </div>
    );
}
