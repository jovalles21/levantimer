# Levantimer

Temporizador de descansos + contador de horas trabajadas. Tauri v2 (macOS) que
además se sirve como PWA. Vite + React 18 + TypeScript + Tailwind v4.

## Comandos

```bash
npm run dev          # solo el frontend en :5173
npm run build        # tsc -b && vite build (única verificación automática que hay)
npm run tauri dev    # app de escritorio en modo desarrollo
npm run tauri build  # bundle release en src-tauri/target/release/bundle/macos/
```

No hay tests ni linter. `npm run build` + prueba manual es toda la verificación.

## Trampa: dev y release NO comparten datos

Las dos ventanas son idénticas pero escriben en almacenes distintos, porque
WebKit los separa por identidad de la app:

| Binario | Almacén |
|---|---|
| `/Applications/levantimer.app` (release) | `~/Library/WebKit/com.jovalles.levantimer/` |
| `target/debug/app` (`tauri dev`) | `~/Library/WebKit/app/` — sin bundle id, cae al nombre del ejecutable |

Consecuencias:

- **No dejes `tauri dev` corriendo** al terminar. Parece la app real, va vacía, y
  se confunde con pérdida de datos.
- Los datos reales del usuario solo están en el almacén de `com.jovalles.levantimer`.
- Reinstalar en `/Applications` no toca los datos mientras el `identifier` de
  `tauri.conf.json` no cambie. Si cambia, se pierde todo el histórico.

Para inspeccionar el almacén (el valor es un blob **UTF-16LE**, no UTF-8):

```bash
B=~/Library/WebKit/com.jovalles.levantimer/WebsiteData/Default/*/*/LocalStorage
cp $B/localstorage.sqlite3* /tmp/ls/          # copia siempre: sqlite3 hace checkpoint del WAL
sqlite3 /tmp/ls/localstorage.sqlite3 "select hex(value) from ItemTable where key='levantimer.worklog';"
```

## Persistencia

Solo `localStorage`. Sin backend, sin sqlite propio, sin plugin de store.

- `levantimer.config` — `Config` de `src/types.ts`. `useLocalStorage` hace
  `{...DEFAULT_CONFIG, ...guardado}`, así que añadir campos nuevos no rompe las
  instalaciones existentes ni requiere migración.
- `levantimer.worklog` — `{ days: Record<'YYYY-MM-DD', {start,end}[]>, active }`.
  Retención de 30 días. `active` se cierra al cargar si quedó huérfana (app
  matada con el timer corriendo).
- `levantimer.goalNotified` — marca del aviso de meta diaria.

## Arquitectura

Toda la lógica del timer vive en React. Rust solo expone tres comandos
(`src-tauri/src/lib.rs`): `get_idle_ms`, `set_tray_title`, `set_alert_mode`.
No hay hilo ni temporizador en Rust.

- `useStandTimer` — máquina de estados `idle`/`working`/`break`. Cuenta contra un
  `endTime` absoluto, nunca acumula, así no se desincroniza si el webview se
  ralentiza.
- `useActivityMonitor` — inactividad del sistema en las dos direcciones. Rama
  nativa por sondeo a `get_idle_ms`; rama navegador por Idle Detection API
  (solo Chrome/Edge).
- `useWorkLog` — registro de la jornada.

### Invariante del registro de jornada

`useActivityMonitor` pasa timestamps **derivados de `idleMs`**, nunca
`Date.now()` del momento del sondeo. Por eso el registro es exacto aunque la
detección llegue un minuto tarde. Si tocas esa parte, mantén la propiedad: es lo
que permite sondear despacio sin falsear las horas.

## Cadencias

Repasa el coste antes de añadir cualquier `setInterval`: la app corre todo el día
en segundo plano. Las actuales, y por qué:

| Dónde | Cada | Por qué |
|---|---|---|
| `useStandTimer` | 1 s | Pinta la cuenta atrás MM:SS en pantalla, título y barra de menú. **No subir.** |
| `useActivityMonitor` | 60 s activo / 5 s inactivo | El umbral son minutos; solo hace falta ir rápido para que reanudar se note |
| `useWorkLog` | 60 s | Solo refresca `lastSeen`. Estaba en 1 s y reescribía el blob entero en `localStorage` cada segundo: el WAL de WebKit llegó a 28 MB para una base de 12 KB. |
