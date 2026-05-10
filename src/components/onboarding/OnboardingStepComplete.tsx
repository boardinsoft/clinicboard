'use client';

import * as React from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import { CheckCircle2, Building2, MapPin, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { OnboardingStepData } from '@/components/onboarding';

export interface OnboardingStepCompleteRef {
    triggerSubmit: () => void;
}

interface OnboardingStepCompleteProps {
    data: OnboardingStepData;
}

export const OnboardingStepComplete = forwardRef<OnboardingStepCompleteRef, OnboardingStepCompleteProps>(
    ({ data }, ref) => {
        const profile = data.profile;
        const clinic = data.clinic;
        const location = data.location;

        useImperativeHandle(ref, () => ({
            triggerSubmit: () => {},
        }));

        const getInitials = (nameGiven: string[], nameFamily: string) => {
            const first = nameGiven?.[0] || '';
            return `${first.charAt(0)}${nameFamily.charAt(0)}`.toUpperCase();
        };

        return (
            <Card className="border border-n-5">
                <CardHeader className="flex flex-col items-center text-center pb-2">
                    <div className="w-16 h-16 bg-b-8/10 rounded-[8px] flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-b-8" />
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground">¡Todo listo!</CardTitle>
                    <CardDescription className="text-[13px] text-n-8 mt-1">
                        Estás a punto de crear tu clínica <span className="font-medium text-foreground">{clinic?.name}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-n-2 rounded-[6px] p-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <Avatar className="size-8">
                                <AvatarFallback className="bg-b-8 text-white text-[11px]">
                                    {profile ? getInitials(profile.name_given, profile.name_family) : '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-[13px] font-medium text-foreground">
                                    {profile?.name_given?.[0]} {profile?.name_family}
                                </p>
                                <p className="text-[11px] text-n-8">{profile?.specialty || 'Sin especialidad'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-[6px] bg-n-3 flex items-center justify-center">
                                <Building2 className="w-4 h-4 text-n-8" />
                            </div>
                            <div>
                                <p className="text-[13px] font-medium text-foreground">{clinic?.name}</p>
                                <p className="text-[11px] text-n-8 font-mono">{clinic?.slug}.clinicboard.app</p>
                            </div>
                        </div>

                        {location && (location.address || location.phone) && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-[6px] bg-n-3 flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-n-8" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-medium text-foreground">
                                        {[location.city, location.state].filter(Boolean).join(', ')}
                                    </p>
                                    {location.address && (
                                        <p className="text-[11px] text-n-8">{location.address}</p>
                                    )}
                                    {location.phone && (
                                        <p className="text-[11px] text-n-8 font-mono">{location.phone}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 bg-n-1 border border-n-5 rounded-[6px] p-4 flex items-start gap-3">
                        <Mail className="h-4 w-4 text-b-8 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[13px] font-medium text-b-8">Invita a tu equipo</p>
                            <p className="text-[12px] text-n-8">
                                Cuando entres al Tablero, puedes invitar doctores y recepcionistas a tu clínica.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }
);

OnboardingStepComplete.displayName = 'OnboardingStepComplete';