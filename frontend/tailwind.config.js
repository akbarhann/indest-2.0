/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'risk-high': '#EF4444',   // Red
                'risk-med': '#F59E0B',    // Yellow
                'risk-low': '#10B981',    // Green
                'brand-dark': '#1e293b',  // Slate 800
                'brand-light': '#f8fafc', // Slate 50
            },
        },
    },
    plugins: [],
}
