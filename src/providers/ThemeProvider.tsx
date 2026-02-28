'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type CarbonTheme = 'white' | 'g90';

interface ThemeContextType {
    theme: CarbonTheme;
    toggleTheme: () => void;
    setTheme: (theme: CarbonTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<CarbonTheme>('g90');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('clinicboard-theme') as CarbonTheme;
        if (savedTheme) {
            setThemeState(savedTheme);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem('clinicboard-theme', theme);
            document.documentElement.setAttribute('data-carbon-theme', theme);
        }
    }, [theme, mounted]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'white' ? 'g90' : 'white'));
    };

    const setTheme = (newTheme: CarbonTheme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
