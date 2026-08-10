import http from 'k6/http';
import { check, sleep } from 'k6';

const TARGET_URL = (__ENV.TARGET_URL || '').replace(/\/$/, '');

if (!TARGET_URL) {
  throw new Error('Define TARGET_URL antes de ejecutar.');
}

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Menos del 1% de errores
    http_req_duration: ['p(95)<1200'], // 95% de resp en menos de 1.2s
  },
};

// Rutas base principales de tu aplicación web
const assets = [
  '/',
  '/index.html',
  // Agrega o quita rutas relativas según existan en tu despliegue de Netlify
];

export default function () {
  const responses = http.batch(
    assets.map((path) => ['GET', `${TARGET_URL}${path}`])
  );

  responses.forEach((res) => {
    const isOk = res.status === 200 || res.status === 304;

    // Si la ruta no existe, la imprime en la consola para ayudarte a depurar
    if (!isOk) {
      console.log(`❌ ERROR ${res.status}: ${res.url}`);
    }

    check(res, {
      'status 200/304': (r) => r.status === 200 || r.status === 304,
      'sin error 5xx': (r) => r.status < 500,
    });
  });

  sleep(1);
}