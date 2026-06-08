/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  			display: ['avenir-w01_85-heavy1475544', '"Avenir Next"', '"Nunito Sans"', 'Helvetica', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			xl: 'calc(var(--radius) + 4px)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			coral: {
  				'50':  '#fef6f5',
  				'100': '#fde8e5',
  				'200': '#fccfc9',
  				'300': '#f9a89d',
  				'400': '#f47a6a',
  				'500': '#E85D4A',
  				'600': '#d43d28',
  				'700': '#b2301d',
  				'800': '#932a1b',
  				'900': '#7a281c',
  				'950': '#43110a',
  			},
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to:   { height: 'var(--radix-accordion-content-height)' },
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to:   { height: '0' },
  			},
  			'fade-in': {
  				from: { opacity: '0' },
  				to:   { opacity: '1' },
  			},
  			'slide-up': {
  				from: { opacity: '0', transform: 'translateY(12px)' },
  				to:   { opacity: '1', transform: 'translateY(0)' },
  			},
  			'slide-down': {
  				from: { opacity: '0', transform: 'translateY(-8px)' },
  				to:   { opacity: '1', transform: 'translateY(0)' },
  			},
  			'slide-left': {
  				from: { opacity: '0', transform: 'translateX(8px)' },
  				to:   { opacity: '1', transform: 'translateX(0)' },
  			},
  			'scale-in': {
  				from: { opacity: '0', transform: 'scale(0.95)' },
  				to:   { opacity: '1', transform: 'scale(1)' },
  			},
  			'pulse-soft': {
  				'0%, 100%': { opacity: '1' },
  				'50%':      { opacity: '0.6' },
  			},
  			'card-lift': {
  				'0%':   { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  				'100%': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' },
  			},
  		},
  		animation: {
  			'accordion-down':  'accordion-down 0.2s ease-out',
  			'accordion-up':    'accordion-up 0.2s ease-out',
  			'fade-in':         'fade-in 0.4s ease-out both',
  			'slide-up':        'slide-up 0.4s ease-out both',
  			'slide-down':      'slide-down 0.3s ease-out both',
  			'slide-left':      'slide-left 0.3s ease-out both',
  			'scale-in':        'scale-in 0.2s ease-out both',
  			'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
  			'card-lift':       'card-lift 0.3s ease-out forwards',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
