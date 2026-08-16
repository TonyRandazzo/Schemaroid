import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL?.trim();

    if (!apiUrl) {
      throw new Error(
        [
          '',
          'VITE_API_URL non è impostata: la build è stata interrotta.',
          '',
          'Vite sostituisce questa variabile dentro il bundle durante la build,',
          'non la legge quando il sito è in esecuzione. Senza valore il frontend',
          "chiamerebbe '/api' sul proprio dominio invece del backend, e la regola",
          'di redirect SPA restituirebbe index.html con stato 200: il browser',
          "mostrerebbe un errore di parsing JSON invece di un 404 comprensibile.",
          '',
          "Su Netlify: Site configuration > Environment variables > VITE_API_URL",
          '  esempio: https://schemaroid-api.onrender.com',
          '',
          "Se invece frontend e backend stanno sullo stesso dominio, imposta",
          "esplicitamente VITE_API_URL=/api per confermare la scelta.",
          '',
        ].join('\n')
      );
    }
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': 'http://localhost:5000',
      },
    },
  };
});
