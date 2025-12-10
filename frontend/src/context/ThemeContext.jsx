import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Check local storage or system preference on initial load
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                return savedTheme;
            }
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Handle system theme changes if user selects 'system' - omitted for simplicity based on plan, 
    // keeping it simple with 'light'/'dark' toggle for now as requested "add dark mode... partially done".
    // Actually, let's keep it robust. If 'system', we should listen.
    // NOTE: For this specific task, "Add dark mode (partially done)" implies making the switch work. 
    // I will stick to explicit light/dark for the toggle to ensure clarity, as planned.

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
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
