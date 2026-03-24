'use client';

import React from 'react';
import { 
    User, 
    Clock, 
    Play, 
    ChevronUp, 
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/lib/fhir/types';
import { format } from 'date-fns';
import { swapQueuePositions } from '@/actions/appointments';
import { toast } from 'sonner';

interface WalkInQueuePanelProps {
    appointments: Appointment[];
    onSelect: (id: string) => void;
    onStartConsultation: (id: string) => void;
    onRefresh: () => void;
}

export default function WalkInQueuePanel({ 
    appointments, 
    onSelect, 
    onStartConsultation,
    onRefresh
}: WalkInQueuePanelProps) {
    // Filter only arrived appointments that have a queue position
    const queue = appointments
        .filter(a => (a.status === 'arrived' || a.status === 'booked') && a.queue_position !== undefined && a.queue_position !== null)
        .sort((a, b) => (a.queue_position || 0) - (b.queue_position || 0));

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 opacity-60 font-sans">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-bold">No hay pacientes en cola</p>
                    <p className="text-xs text-muted-foreground">Los pacientes por orden de llegada aparecerán aquí.</p>
                </div>
            </div>
        );
    }

    const swapPositions = async (idx1: number, idx2: number) => {
        const app1 = queue[idx1];
        const app2 = queue[idx2];

        if (!app1 || !app2) return;

        try {
            const result = await swapQueuePositions(
                app1.id, app1.queue_position!,
                app2.id, app2.queue_position!
            );

            if (result.error) {
                toast.error('Error al reordenar la cola');
            } else {
                onRefresh();
            }
        } catch {
            toast.error('Error de red');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/50 font-sans">
            <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold px-2 py-0.5">
                        {queue.length}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-700">Pacientes en Espera</h3>
                </div>
            </div>

            <ScrollArea className="flex-1 p-3">
                <div className="space-y-3 pb-20">
                    {queue.map((appointment, index) => (
                        <div 
                            key={appointment.id}
                            className={cn(
                                "group bg-white rounded-xl border border-border/60 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden",
                                index === 0 && "border-primary/30 ring-1 ring-primary/5 shadow-primary/5"
                            )}
                            onClick={() => onSelect(appointment.id)}
                        >
                            {/* Position Badge */}
                            <div className={cn(
                                "absolute top-0 right-0 px-3 py-1 text-[10px] font-bold rounded-bl-xl",
                                index === 0 ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                            )}>
                                #{appointment.queue_position}
                            </div>

                            <div className="flex gap-3">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 border-2",
                                    index === 0 ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-100 border-slate-200 text-slate-400"
                                )}>
                                    <User className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0 pr-6">
                                    <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                                        {appointment.patient?.name_family}, {appointment.patient?.name_given?.join(' ')}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 min-h-[1.25rem]">
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(appointment.start_time), 'hh:mm a')}
                                        </div>
                                        {appointment.status === 'booked' && (
                                            <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-600 border-orange-200 font-bold py-0 leading-none h-4">
                                                PEND. LLEGADA
                                            </Badge>
                                        )}
                                        {appointment.status === 'arrived' && (
                                            <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200 font-bold py-0 leading-none h-4">
                                                EN SALA
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                                        disabled={index === 0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            swapPositions(index, index - 1);
                                        }}
                                    >
                                        <ChevronUp className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-slate-400 hover:text-slate-600 disabled:opacity-20"
                                        disabled={index === queue.length - 1}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            swapPositions(index, index + 1);
                                        }}
                                    >
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </div>

                                <Button 
                                    size="sm" 
                                    variant={index === 0 ? "default" : "outline"}
                                    className={cn(
                                        "h-7 text-[11px] font-bold gap-1.5 px-3 rounded-lg",
                                        index === 0 && "bg-primary hover:bg-primary/90 shadow-sm"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStartConsultation(appointment.id);
                                    }}
                                >
                                    <Play className="w-3 h-3 fill-current" />
                                    Llamar / Iniciar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
