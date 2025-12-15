import { useState, useEffect } from 'react';
import type { Theme } from '../types';

export function useTheme() {
    const [theme, setTheme] = useState<Theme>('dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return {
        theme,
        setTheme,
        toggleTheme
    };
}
