'use client';

import React from 'react';
import {
    DataTable,
    Table,
    TableHead,
    TableRow,
    TableHeader,
    TableBody,
    TableCell,
    TableContainer,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
    Button,
    Tag,
    Pagination,
} from '@carbon/react';
import { Add, View, Edit } from '@carbon/icons-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const headers = [
    { key: 'name', header: 'Nombre Completo' },
    { key: 'gender', header: 'Género' },
    { key: 'birthDate', header: 'Fecha Nacimiento' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'lastVisit', header: 'Última Visita' },
    { key: 'status', header: 'Estado' },
    { key: 'actions', header: '' },
];

interface PatientsListViewProps {
    patients: any[];
    totalItems: number;
    page: number;
    pageSize: number;
}

export default function PatientsListView({ patients, totalItems, page, pageSize }: PatientsListViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const updateParams = (updates: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) params.set(key, String(value));
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (e: any) => {
        const value = e.target.value;
        updateParams({ q: value, page: 1 });
    };

    const handlePagination = ({ page: p, pageSize: ps }: { page: number; pageSize: number }) => {
        updateParams({ page: p, pageSize: ps });
    };

    const formattedRows = patients.map((p: any) => ({
        id: p.id,
        name: `${p.name_given?.join(' ')} ${p.name_family}`,
        gender: p.gender === 'male' ? 'Masculino' : p.gender === 'female' ? 'Femenino' : p.gender || 'N/A',
        birthDate: p.birth_date || 'N/A',
        phone: (p.telecom as any)?.[0]?.value || 'N/A',
        lastVisit: '2026-02-26', // TODO: Get from last encounter
        status: p.active ? 'active' : 'inactive',
    }));

    return (
        <div style={{ padding: 0 }}>
            <div className="page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="page-header__title">Pacientes</h1>
                        <p className="page-header__subtitle">
                            Registro de pacientes — FHIR R4 Patient Resource
                        </p>
                    </div>
                    <Button kind="primary" renderIcon={Add} onClick={() => router.push('/patients/new')}>
                        Nuevo Paciente
                    </Button>
                </div>
            </div>

            <div style={{ padding: '0' }}>
                <DataTable rows={formattedRows} headers={headers as any} isSortable>
                    {({
                        rows,
                        headers: tableHeaders,
                        getHeaderProps,
                        getRowProps,
                        getTableProps,
                        getTableContainerProps,
                    }: any) => (
                        <TableContainer {...getTableContainerProps()}>
                            <TableToolbar>
                                <TableToolbarContent>
                                    <TableToolbarSearch
                                        onChange={handleSearch}
                                        defaultValue={searchParams.get('q') || ''}
                                        placeholder="Buscar paciente por apellido o nombre..."
                                        persistent
                                    />
                                </TableToolbarContent>
                            </TableToolbar>
                            <Table {...getTableProps()} size="lg">
                                <TableHead>
                                    <TableRow>
                                        {tableHeaders.map((header: { key: string; header: string }) => {
                                            const { key, ...restHeaderProps } = getHeaderProps({ header });
                                            return (
                                                <TableHeader key={header.key || key} {...restHeaderProps}>
                                                    {header.header}
                                                </TableHeader>
                                            );
                                        })}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {rows.map((row: any) => {
                                        const { key, ...restRowProps } = getRowProps({ row });
                                        return (
                                            <TableRow key={row.id || key} {...restRowProps}>
                                                {row.cells.map((cell: any) => {
                                                    if (cell.info.header === 'status') {
                                                        return (
                                                            <TableCell key={cell.id}>
                                                                <Tag type={cell.value === 'active' ? 'green' : 'gray'} size="sm">
                                                                    {cell.value === 'active' ? 'Activo' : 'Inactivo'}
                                                                </Tag>
                                                            </TableCell>
                                                        );
                                                    }
                                                    if (cell.info.header === 'actions') {
                                                        return (
                                                            <TableCell key={cell.id}>
                                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                                    <Button
                                                                        kind="ghost"
                                                                        size="sm"
                                                                        hasIconOnly
                                                                        renderIcon={View}
                                                                        iconDescription="Ver paciente"
                                                                        onClick={() => router.push(`/patients/${row.id}`)}
                                                                    />
                                                                    <Button
                                                                        kind="ghost"
                                                                        size="sm"
                                                                        hasIconOnly
                                                                        renderIcon={Edit}
                                                                        iconDescription="Editar paciente"
                                                                        onClick={() => router.push(`/patients/${row.id}/edit`)}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        );
                                                    }
                                                    return <TableCell key={cell.id}>{cell.value}</TableCell>;
                                                })}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DataTable>

                <Pagination
                    backwardText="Página anterior"
                    forwardText="Página siguiente"
                    itemsPerPageText="Filas por página:"
                    page={page}
                    pageSize={pageSize}
                    pageSizes={[10, 25, 50]}
                    totalItems={totalItems}
                    onChange={handlePagination}
                />
            </div>
        </div>
    );
}
