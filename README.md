# Reparo (demo)

Prototipo de software para locales de reparación de celulares. Solo frontend: el backend está simulado en el navegador.

Publicado con GitHub Pages en https://waypoint-studio.github.io/reparo/

## Qué incluye

- Tablero: equipos en el local, ingresos del mes, conteo por estado, equipos sin recoger y repuestos por agotarse.
- Órdenes: búsqueda y filtro por estado.
- Recibir equipo: cliente, equipo, estado al recibir, fotos, estimado y abono.
- Detalle de la orden con el siguiente paso según el estado: diagnóstico, presupuesto, aprobación, repuestos, listo, entrega con garantía y recordatorios.
- Mensajes de WhatsApp simulados en cada cambio de estado.
- Vista pública de seguimiento para el cliente: `#/seguimiento/<código>`.
- Inventario de repuestos que se descuenta al usarlos.

## Backend simulado

`src/api/repair-api.ts` define el contrato. `src/api/mock/mock-backend.ts` lo implementa en memoria con latencia simulada y guarda el estado en `localStorage` del navegador. Para conectar un backend real basta con otra implementación de `RepairApi` y cambiarla en `src/api/client.ts`.

## Desarrollo

```bash
pnpm install
pnpm dev
pnpm lint && pnpm typecheck
pnpm build
```

## Publicación

Pages sirve la carpeta `docs/` de `main`. `pnpm build` compila ahí; el resultado se sube junto con el código en cada PR.
