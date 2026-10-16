# Chasing Cards Widget

Widget para overlays de stream (OBS) que muestra, en rotación, las cartas más valiosas de un set de TCG según los precios de TCGplayer. Incluye una pantalla de configuración que genera el link del widget.

Extraído del proyecto `stream-widgets`.

## Stack

- React 19 + Vite + TypeScript
- React-Bootstrap
- Netlify Functions (TypeScript)
- Vitest + Testing Library

## Requisitos

- Node 24 (ver `.nvmrc`)

## Desarrollo local

```bash
npm install
npm run dev
```

`@netlify/vite-plugin` emula el entorno de Netlify dentro de `vite dev`, por lo que las functions responden en el mismo servidor:

- `http://localhost:5173/.netlify/functions/health`
- `http://localhost:5173/api/health` (redirect definido en `netlify.toml`)

Copia `.env.example` a `.env` si necesitas sobrescribir variables.

## Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con functions |
| `npm run build` | Typecheck + build de producción en `dist/` |
| `npm run preview` | Sirve el build local |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc -b` (app, config y functions) |
| `npm test` / `test:watch` / `test:coverage` | Vitest |

## Estructura

```
netlify/
  functions/   Netlify Functions (endpoints)
  lib/         lógica compartida de las functions
src/
  components/  componentes de UI
  constants/   constantes (TCGs)
  hooks/       hooks de datos
  lib/         config del widget, formateo
  pages/       pantallas (configuración, widget)
  services/    cliente de las functions
  styles/      estilos globales
  types/       tipos compartidos
  test/        setup de tests
```

## Deploy

Netlify toma la configuración de `netlify.toml` (`npm run build`, publica `dist/`, functions en `netlify/functions`).
