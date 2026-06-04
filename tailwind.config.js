/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)'],
  			display: ['var(--font-display)'],
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
 			brand: {
 				btn:       '#9F121A',
 				'btn-hover': '#7A0E14',
 				action:    '#9F121A',
 				'action-light': 'rgba(159, 18, 26, 0.1)',
 				gold:      '#D4A853',
 				'gold-light': 'rgba(212, 168, 83, 0.12)',
 				'gold-subtle': '#F8F0E0',
 				ink:       '#384252',
 				heading:   '#384252',
 				subtitle:  '#6B7280',
 			},
  		},
  		backgroundImage: {
  			'gold-gradient': 'linear-gradient(135deg, #D4A853 0%, #F5E7C8 50%, #C89B3C 100%)',
  			'gold-subtle': 'linear-gradient(135deg, rgba(212,168,83,0.08) 0%, rgba(212,168,83,0.02) 100%)',
  			'brand-gradient': 'linear-gradient(135deg, #9F121A 0%, #D43F43 100%)',
  			'dark-gradient': 'linear-gradient(135deg, rgb(2, 22, 42) 0%, rgb(4, 42, 74) 50%, rgb(2, 22, 42) 100%)',
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
  				from: { opacity: '0', transform: 'translateY(16px)' },
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
  			'gold-shimmer': {
  				'0%':   { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  			'gold-glow': {
  				'0%, 100%': { boxShadow: '0 0 5px rgba(212,168,83,0.3), 0 0 10px rgba(212,168,83,0.1)' },
  				'50%':      { boxShadow: '0 0 10px rgba(212,168,83,0.5), 0 0 20px rgba(212,168,83,0.2)' },
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%':      { transform: 'translateY(-4px)' },
  			},
  			'pulse-soft': {
  				'0%, 100%': { opacity: '1' },
  				'50%':      { opacity: '0.7' },
  			},
  			'gradient-shift': {
  				'0%':   { backgroundPosition: '0% 50%' },
  				'50%':  { backgroundPosition: '100% 50%' },
  				'100%': { backgroundPosition: '0% 50%' },
  			},
  			'card-lift': {
  				'0%':   { transform: 'translateY(0)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  				'100%': { transform: 'translateY(-4px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' },
  			},
  			'width-fill': {
  				from: { width: '0%' },
  			},
  			'rotate-in': {
  				from: { opacity: '0', transform: 'rotate(-10deg) scale(0.9)' },
  				to:   { opacity: '1', transform: 'rotate(0deg) scale(1)' },
  			},
  		},
  		animation: {
  			'accordion-down':  'accordion-down 0.2s ease-out',
  			'accordion-up':    'accordion-up 0.2s ease-out',
  			'fade-in':         'fade-in 0.5s ease-out both',
  			'slide-up':        'slide-up 0.5s ease-out both',
  			'slide-down':      'slide-down 0.4s ease-out both',
  			'slide-left':      'slide-left 0.4s ease-out both',
  			'scale-in':        'scale-in 0.3s ease-out both',
  			'gold-shimmer':    'gold-shimmer 2s infinite linear',
  			'gold-glow':       'gold-glow 2s ease-in-out infinite',
  			'float':           'float 3s ease-in-out infinite',
  			'pulse-soft':      'pulse-soft 2s ease-in-out infinite',
  			'gradient-shift':  'gradient-shift 4s ease infinite',
  			'card-lift':       'card-lift 0.3s ease-out forwards',
  			'width-fill':      'width-fill 1s ease-out both',
  			'rotate-in':       'rotate-in 0.5s ease-out both',
  		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
