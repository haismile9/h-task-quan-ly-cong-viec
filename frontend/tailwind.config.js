/** Màu từ biến CSS của daisyUI, hỗ trợ <alpha-value> (bg-primary/10, text-base-content/60...). */
const themeColor = (name) => `color-mix(in oklab, var(--color-${name}) calc(<alpha-value> * 100%), transparent)`;

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Màu theme daisyUI 5 (biến CSS) để Tailwind 3 hiểu được modifier độ trong suốt như bg-primary/10
      colors: {
        'base-100': themeColor('base-100'),
        'base-200': themeColor('base-200'),
        'base-300': themeColor('base-300'),
        'base-content': themeColor('base-content'),
        'primary': themeColor('primary'),
        'primary-content': themeColor('primary-content'),
        'secondary': themeColor('secondary'),
        'secondary-content': themeColor('secondary-content'),
        'accent': themeColor('accent'),
        'accent-content': themeColor('accent-content'),
        'neutral': themeColor('neutral'),
        'neutral-content': themeColor('neutral-content'),
        'info': themeColor('info'),
        'info-content': themeColor('info-content'),
        'success': themeColor('success'),
        'success-content': themeColor('success-content'),
        'warning': themeColor('warning'),
        'warning-content': themeColor('warning-content'),
        'error': themeColor('error'),
        'error-content': themeColor('error-content'),
      },
      animation: {
        'scroll-right': 'scrollRight 30s linear infinite',
        'scroll-left': 'scrollLeft 25s linear infinite',
        'scroll-right-slow': 'scrollRight 40s linear infinite',
        'scroll-left-slow': 'scrollLeft 35s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scrollRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scrollLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeInUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(30px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { 
            boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)',
            transform: 'scale(1)',
          },
          '100%': { 
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
            transform: 'scale(1.1)',
          },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
  ],
}
