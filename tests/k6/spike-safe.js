import http from 'k6/http';
import { check, sleep } from 'k6';

const TARGET_URL = 'https://visor-iiuu.vercel.app';

export const options = {
  scenarios: {
    carga_progresiva: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 15 }, // Fase 1: Calentamiento suave (15 VUs)
        { duration: '40s', target: 35 }, // Fase 2: Subida constante (35 VUs)
        { duration: '50s', target: 60 }, // Fase 3: Pico de carga (60 VUs)
        { duration: '1m',  target: 60 }, // Fase 4: Sostener la meseta (1 min)
        { duration: '20s', target: 0 },  // Fase 5: Enfriamiento
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],     // Máximo 2% de fallos
    http_req_duration: ['p(95)<1500'],  // El 95% de resp. debe ser menor a 1.5s
  },
};

export default function () {
  const res = http.get(`${TARGET_URL}/`);

  check(res, {
    'respuesta exitosa (200/304)': (r) => r.status === 200 || r.status === 304,
    'sin bloqueos (no 429/403)': (r) => r.status !== 429 && r.status !== 403,
  });

  // Pausa aleatoria (1s - 2.5s) que simula la navegación humana y evita saturar la IP local
  sleep(Math.random() * 1.5 + 1);
}