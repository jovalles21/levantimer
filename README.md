# Levantimer

Temporizador que te avisa cada cierto tiempo (configurable) para levantarte a
estirar las piernas durante unos minutos, y no pasar tanto rato sentado.

El aviso es invasivo a propósito: suena, lanza una notificación del sistema y
muestra un overlay a pantalla completa durante el descanso.

## Características

- Intervalo de trabajo y duración del descanso configurables (en minutos).
- Alerta triple: sonido, notificación del sistema y overlay a pantalla completa.
- Overlay del descanso **bloqueante o no bloqueante** (a elección del usuario).
- Toda la configuración se guarda en `localStorage`.
- PWA: instalable y funciona offline.

## Stack

Vite + React + TypeScript + Tailwind CSS + vite-plugin-pwa.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción (genera el service worker del PWA)
npm run preview  # sirve el build; instala la PWA desde aquí
```

> El service worker solo se registra en el build de producción, no en `dev`.
