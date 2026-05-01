import React, { createContext, useContext, useState, useEffect } from 'react';

export const COLORS = {
	light: {
		primary: '#0F1C3F',
		primaryRGB: '15, 28, 63',
		secondary: '#D4AF37',
		secondaryRGB: '212, 175, 55',
		accent: '#E0E0E0',
		text: '#36454F',
		background: '#F9FAFC',
		white: '#FFFFFF',
		danger: '#E74C3C',
		success: '#2ECC71',
		inputBg: '#F0F2F5',
		card: '#FFFFFF',
		whiteRGB: '255, 255, 255',
		border: '#F1F5F9',
		muted: '#A0AEC0',
	},
	dark: {
		primary: '#D4AF37',
		primaryRGB: '212, 175, 55',
		secondary: '#0F1C3F',
		secondaryRGB: '15, 28, 63',
		accent: '#2D3748',
		text: '#F7FAFC',
		background: '#0F172A',
		white: '#1E293B',
		whiteRGB: '30, 41, 59',
		danger: '#F87171',
		success: '#34D399',
		inputBg: '#334155',
		card: '#1E293B',
		border: '#334155',
		muted: '#94A3B8',
	},
};

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
	theme: ThemeType;
	isDark: boolean;
	colors: typeof COLORS.light;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialTheme = (): ThemeType => {
	const savedTheme = localStorage.getItem('user-theme');
	if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
	
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}
	return 'light';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<ThemeType>(getInitialTheme);

	useEffect(() => {
		// Listen for system theme changes
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			const savedTheme = localStorage.getItem('user-theme');
			// Only update automatically if user hasn't manually overridden
			if (!savedTheme) {
				setTheme(e.matches ? 'dark' : 'light');
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	useEffect(() => {
		const root = document.documentElement;
		if (theme === 'dark') {
			root.classList.add('dark');
		} else {
			root.classList.remove('dark');
		}
		
		const colors = theme === 'dark' ? COLORS.dark : COLORS.light;
		
		Object.entries(colors).forEach(([key, value]) => {
			const cssKey = `--${key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
			root.style.setProperty(cssKey, value);
		});
		
		root.style.setProperty('--bg-color', colors.background);
		root.style.setProperty('--surface-color', colors.card);
		root.style.setProperty('--text-primary', colors.text);
		root.style.setProperty('--text-secondary', colors.muted);
		root.style.setProperty('--primary-color', colors.primary);
		root.style.setProperty('--accent-color', colors.secondary);
		root.style.setProperty('--border-color', colors.border);
		root.style.setProperty('--input-bg', colors.inputBg);
		root.style.setProperty('--primary-rgb', colors.primaryRGB);
		root.style.setProperty('--secondary-rgb', colors.secondaryRGB);
		root.style.setProperty('--white-rgb', colors.whiteRGB);
		
		// If the user manually set a theme, keep it in localStorage
		// If we're just following system, maybe don't force it into localStorage yet?
		// Actually, standard behavior is to save if changed manually.
	}, [theme]);

	const isDark = theme === 'dark';
	const colors = isDark ? COLORS.dark : COLORS.light;

	const toggleTheme = () => {
		const newTheme = theme === 'light' ? 'dark' : 'light';
		setTheme(newTheme);
		localStorage.setItem('user-theme', newTheme);
	};

	return (
		<ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme }}>
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
