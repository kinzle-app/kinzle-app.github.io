import { defineConfig } from 'vite';
import { contentPlugin } from './scripts/content-files.js';

// Verze obsahu = čas sestavení. Zabalená kopie i manifest na webu ji mají stejnou;
// aplikace stáhne obsah jen tehdy, když je na webu novější.
const CONTENT_VERSION = new Date().toISOString();

// Relativní cesty ('./'): hra funguje v kořeni webu, na vlastní doméně
// i později zabalená v Capacitoru, bez úprav.
export default defineConfig({
  base: './',
  define: { __CONTENT_VERSION__: JSON.stringify(CONTENT_VERSION) },
  plugins: [contentPlugin(CONTENT_VERSION)],
  test: {
    include: ['tests/**/*.test.js']
  }
});
