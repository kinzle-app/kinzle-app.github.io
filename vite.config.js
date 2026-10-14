import { defineConfig } from 'vite';

// Relativní cesty ('./'): hra funguje v kořeni webu, na vlastní doméně
// i později zabalená v Capacitoru, bez úprav.
export default defineConfig({
  base: './',
  test: {
    include: ['tests/**/*.test.js']
  }
});
