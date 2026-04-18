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
				sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
			},
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				brand: {
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
					DEFAULT: 'var(--b-8)',
				},
				neutral: {
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
					foreground: '#ffffff',
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
				chart: {
					'1': 'var(--chart-1)',
					'2': 'var(--chart-2)',
					'3': 'var(--chart-3)',
					'4': 'var(--chart-4)',
					'5': 'var(--chart-5)'
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
