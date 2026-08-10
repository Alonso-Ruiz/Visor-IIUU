import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const rawTargetUrl = __ENV.TARGET_URL || 'https://visor-iiuu.vercel.app';
const targetUrl = rawTargetUrl.endsWith('/') ? rawTargetUrl.slice(0, -1) : rawTargetUrl;

const testDuration = __ENV.TEST_DURATION || '10m';
const maxDuration = __ENV.MAX_DURATION || '15m';
const vus = Number(__ENV.VUS || 100);
const mode = (__ENV.MODE || 'sustained').toLowerCase(); // 'sustained', 'burst', 'ramp_step'
const debugErrors = String(__ENV.DEBUG_ERRORS || '').toLowerCase() === 'true';

const statusErrors = new Counter('status_errors');

// Endpoints reales de tu visor (ligeros para sostener 100k sin saturar la red local)
const staticAssets = [
  '/',
  '/css/app.css',
  '/css/leaflet.css',
  '/js/leaflet.js',
  '/js/app/core.js',
  '/js/app/layers.js',
  '/js/app/controls.js',
  '/js/app/panel.js',
  '/js/app/vias-search.js',
  '/assets/icon_leyenda.png',
];

let scenario;

if (mode === 'burst') {
  scenario = {
    executor: 'shared-iterations',
    vus: vus,
    iterations: 100000,
    maxDuration: maxDuration,
  };
} else if (mode === 'ramp_step') {
  scenario = {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 100 },
      { duration: '5m', target: 150 },
      { duration: '1m', target: 0 },
    ],
    gracefulRampDown: '30s',
  };
} else {
  // MODO SUSTAINED (POR DEFECTO): 170 req/s = 102,000 peticiones en 10m
  scenario = {
    executor: 'constant-arrival-rate',
    rate: 170,
    timeUnit: '1s',
    duration: testDuration,
    preAllocatedVUs: 40,
    maxVUs: 150,
  };
}

export const options = {
  scenarios: {
    visor_load_test: scenario,
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  // Selecciona 1 recurso aleatorio por ciclo para mantener distribución constante
  const assetPath = staticAssets[Math.floor(Math.random() * staticAssets.length)];
  const res = http.get(`${targetUrl}${assetPath}`, {
    tags: { asset: assetPath },
    timeout: '5s',
  });

  const isOk = check(res, {
    'status 200/304': (r) => r.status === 200 || r.status === 304,
    'response below 2s': (r) => r.timings.duration < 2000,
  });

  if (!isOk) {
    statusErrors.add(1, {
      asset: assetPath,
      status: String(res.status || 'network_error'),
    });

    if (debugErrors) {
      console.log(`ERROR asset=${assetPath} status=${res.status} url=${targetUrl}${assetPath}`);
    }
  }

  // En modo arrival-rate no se requiere sleep, pero en modos por VUs regula el flujo
  if (mode !== 'sustained') {
    sleep(0.1);
  }
}

export function handleSummary(data) {
  const reqs = data.metrics.http_reqs?.values?.count ?? 0;
  const failed = data.metrics.http_req_failed?.values?.rate ?? 0;
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] ?? 0;

  return {
    stdout:
      '\n========================================\n' +
      '       RESUMEN FINAL DE PRUEBA K6        \n' +
      '========================================\n' +
      `URL Objetivo:        ${targetUrl}\n` +
      `Modo de Ejecucion:   ${mode.toUpperCase()}\n` +
      `Peticiones Totales:  ${reqs}\n` +
      '----------------------------------------\n' +
      `Tasa de Fallos:      ${(failed * 100).toFixed(2)}%\n` +
      `Latencia (p95):      ${p95.toFixed(2)} ms\n` +
      `Errores Detectados:  ${data.metrics.status_errors?.values?.count ?? 0}\n` +
      '========================================\n\n',
  };
}