/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ['class'],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    plugins: [require('tailwindcss-animate')],
    theme: {
        extend: {
            // Web Interface Guidelines compliance
            textWrap: {
                'balance': 'balance',
                'pretty': 'pretty',
            },
        },
    },
};
