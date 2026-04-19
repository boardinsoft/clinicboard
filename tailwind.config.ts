import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config = {
	darkMode: ["class"],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['var(--font-outfit)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
			},
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				// Escala Neutra (Slate Frío)
				n: {
					1: 'var(--n-1)',
					2: 'var(--n-2)',
					3: 'var(--n-3)',
					4: 'var(--n-4)',
					5: 'var(--n-5)',
					6: 'var(--n-6)',
					7: 'var(--n-7)',
					8: 'var(--n-8)',
					9: 'var(--n-9)',
					10: 'var(--n-10)',
					11: 'var(--n-11)',
					12: 'var(--n-12)',
				},
				// Escala Brand (Clinical Teal)
				b: {
					1: 'var(--b-1)',
					2: 'var(--b-2)',
					3: 'var(--b-3)',
					4: 'var(--b-4)',
					5: 'var(--b-5)',
					6: 'var(--b-6)',
					7: 'var(--b-7)',
					8: 'var(--b-8)',
					9: 'var(--b-9)',
					10: 'var(--b-10)',
					11: 'var(--b-11)',
					12: 'var(--b-12)',
				},
				// Compatibilidad con escalas descriptivas
				brand: {
					DEFAULT: 'var(--b-8)',
					active: 'var(--b-7)',
					dark: 'var(--b-10)',
				},
				neutral: {
					DEFAULT: 'var(--n-8)',
					surface: 'var(--n-2)',
					border: 'var(--n-5)',
				},
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				success: {
					DEFAULT: 'var(--s-success)',
					bg: 'var(--s-success-bg)',
					border: 'var(--s-success-br)',
				},
				warning: {
					DEFAULT: 'var(--s-warning)',
					bg: 'var(--s-warning-bg)',
					border: 'var(--s-warning-br)',
				},
				info: {
					DEFAULT: 'var(--s-info)',
					bg: 'var(--s-info-bg)',
					border: 'var(--s-info-br)',
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				}
			},
			spacing: {
				'1': '4px',
				'2': '8px',
				'3': '12px',
				'4': '16px',
				'5': '20px',
				'6': '24px',
				'8': '32px',
				'10': '40px',
				'12': '48px',
			},
			borderRadius: {
				'1': '4px',
				'2': '6px',
				'3': '8px',
				lg: 'var(--radius)', // 8px
				md: 'calc(var(--radius) - 2px)', // 6px
				sm: 'calc(var(--radius) - 4px)' // 4px
			},
			fontSize: {
				xs: ['12px', '16px'],
				sm: ['13px', '18px'],
				base: ['15px', '22px'],
				lg: ['16px', '24px'],
				xl: ['18px', '26px'],
				'2xl': ['20px', '28px'],
				'3xl': ['24px', '32px'],
				'4xl': ['28px', '36px'],
				'5xl': ['32px', '40px'],
			},
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
