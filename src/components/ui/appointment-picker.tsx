'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { nowInVE } from '@/lib/date-utils';
import { isToday, startOfDay } from 'date-fns';

interface AppointmentPickerProps {
    date: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    time: string | null;
    onTimeChange: (time: string | null) => void;
    className?: string;
}

export function AppointmentPicker({
    date,
    onDateChange,
    time,
    onTimeChange,
    className
}: AppointmentPickerProps) {
    // Generate 15-minute intervals from 07:00 to 19:00 (standard medical hours)
    // Filter out past times if the selected date is today
    const availableTimes = React.useMemo(() => {
        const times = [];
        const now = nowInVE();
        const isSelectedToday = date ? isToday(date) : false;

        for (let hour = 7; hour <= 19; hour++) {
            for (let min = 0; min < 60; min += 15) {
                // Check if this time slot is in the past for today
                if (isSelectedToday) {
                    if (hour < now.getHours() || (hour === now.getHours() && min <= now.getMinutes())) {
                        continue;
                    }
                }

                const h = hour % 12 || 12;
                const ampm = hour < 12 ? 'AM' : 'PM';
                const m = min.toString().padStart(2, '0');
                const timeString = `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
                times.push(timeString);
            }
        }
        return times;
    }, [date]);

    // Disable past dates in the calendar
    const disabledDays = React.useMemo(() => {
        const today = startOfDay(nowInVE());
        return { before: today };
    }, []);

    return (
        <div className={cn("flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x overflow-hidden rounded-md border bg-background", className)}>
            <div className="p-1">
                <Calendar 
                    mode="single" 
                    selected={date} 
                    onSelect={onDateChange}
                    disabled={disabledDays}
                    locale={es}
                    className="p-3"
                />
            </div>
            <div className="relative w-full sm:w-[200px] bg-muted/5">
                <div className="flex flex-col h-[320px]">
                    <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-2.5">
                        <p className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">
                            Horarios
                        </p>
                    </div>
                    <ScrollArea className="flex-1">
                        {availableTimes.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 p-3">
                                {availableTimes.map((t) => (
                                    <Button
                                        key={t}
                                        type="button"
                                        onClick={() => onTimeChange(t)}
                                        size="sm"
                                        variant={time === t ? "default" : "outline"}
                                        className={cn(
                                            "text-[11px] font-medium h-8 transition-all",
                                            time === t ? "shadow-md scale-[1.02]" : "hover:bg-primary/5 hover:text-primary"
                                        )}
                                    >
                                        {t}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                <p className="text-[10px] text-muted-foreground">
                                    No hay horarios disponibles para el resto del día.
                                </p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
}
