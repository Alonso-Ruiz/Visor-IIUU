# Pruebas de rendimiento con k6

Estos scripts prueban la capacidad HTTP del visor publicado. No ejecutan Leaflet como un navegador; sirven para medir descargas, latencia, errores y estabilidad del hosting/CDN.

URL actual de Netlify:

```txt
https://espaciospublicosmsb.netlify.app/
```

## Importante

Aunque ejecutes k6 desde tu PC, si apuntas a Netlify las peticiones llegan a Netlify. Haz pruebas por etapas y detén la prueba si aparecen muchos `403`, `429` o `5xx`.

El archivo `k6.exe` está copiado en la raíz del proyecto para que puedas usarlo así:

```powershell
.\k6.exe version
```

Antes de subir el proyecto a producción o repositorio, puedes borrar `k6.exe` si no quieres incluirlo.

## 1. Prueba pequeña: smoke

Sirve para validar que la página y los archivos principales responden correctamente.

```powershell
cd "C:\Users\Alonso\Desktop\Visor-IIUU"
$env:TARGET_URL="https://espaciospublicosmsb.netlify.app"
.\k6.exe run tests\k6\smoke.js
```

## 2. Pico controlado: spike-safe

Sirve para simular un aumento corto de usuarios sin empezar con una prueba pesada.

```powershell
cd "C:\Users\Alonso\Desktop\Visor-IIUU"
$env:TARGET_URL="https://espaciospublicosmsb.netlify.app"
.\k6.exe run tests\k6\spike-safe.js
```

## 3. Carga grande: load-100k

Sirve para generar una carga sostenida y superar aproximadamente 100.000 peticiones totales, según la duración y los usuarios virtuales.

Versión moderada:

```powershell
cd "C:\Users\Alonso\Desktop\Visor-IIUU"
$env:TARGET_URL="https://espaciospublicosmsb.netlify.app"
$env:MAX_VUS="200"
$env:TEST_DURATION="10m"
.\k6.exe run tests\k6\load-100k.js
```

Versión más suave:

```powershell
cd "C:\Users\Alonso\Desktop\Visor-IIUU"
$env:TARGET_URL="https://espaciospublicosmsb.netlify.app"
$env:MAX_VUS="100"
$env:TEST_DURATION="8m"
.\k6.exe run tests\k6\load-100k.js
```

Versión más fuerte:

```powershell
cd "C:\Users\Alonso\Desktop\Visor-IIUU"
$env:TARGET_URL="https://espaciospublicosmsb.netlify.app"
$env:MAX_VUS="300"
$env:TEST_DURATION="12m"
.\k6.exe run tests\k6\load-100k.js
```

## Qué mirar en los resultados

- `http_req_failed`: idealmente cerca de `0%`.
- `http_req_duration`: mientras menor, mejor.
- `p(95)`: tiempo máximo aproximado para el 95% de las peticiones.
- `checks`: idealmente cerca de `100%`.
- `403`: posible bloqueo.
- `429`: límite de peticiones.
- `5xx`: error del servidor/CDN.

