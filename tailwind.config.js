module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        dark: {
          400: "#666666",
          500: "#505050",
          600: "#414141",
          700: "#313131",
          800: "#212121",
          900: "#121212",
          1000: "#060606",
        },
        primary: {
          700: "#33c146",
          800: "#2CA73C",
          900: "#2ba13b",
        },
        accent: {
          900: "#4D7EA8",
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      minHeight: {
        '12': '3rem',
        '16': '4rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
    },
  },
}
