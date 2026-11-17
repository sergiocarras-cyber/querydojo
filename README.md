# QueryDojo

Web personal para preparar entrevistas técnicas (data engineer / data analyst / software engineer):
SQL, Python de algoritmos, pandas y estadística. **Todo se ejecuta en el navegador**: sin backend,
sin API keys, coste 0 €.

- **SQL:** PostgreSQL real en WebAssembly ([PGlite](https://pglite.dev)) dentro de un Web Worker.
- **Python:** Pyodide en un Web Worker (llega en la fase 3).
- **Progreso:** `localStorage` del navegador.

## Arrancar

Requisitos: Node 20 o superior (probado con Node 26).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # valida el formato y ejecuta las soluciones oficiales
npm run build      # build estático en dist/
```

Atajos del editor: **⌘/Ctrl + Enter** ejecuta (Run).

## Estructura

```
problems/<sección>/<slug>.md   ← un archivo por problema (sql, algorithms, pandas, stats)
src/lib/problems/              ← tipos, parser y registro de problemas
src/lib/sql/                   ← motor SQL compartido (engine.ts), worker y cliente
src/components/, src/pages/    ← interfaz (React + Tailwind)
tests/                         ← Vitest: formato de problemas y verificación de soluciones
```

## Formato de un problema

Cada problema es un archivo Markdown con *frontmatter* YAML. El nombre del archivo debe ser
`<slug>.md` y estar en la carpeta de su sección. El cuerpo se divide en secciones `## Nombre`
(el orden da igual). Los problemas se escriben en inglés; la interfaz está en español.

### Frontmatter (común)

```yaml
---
id: sql-001              # prefijo por sección: sql-, algo-, pandas-, stats- + 3 dígitos
slug: minutes-watched-per-plan   # kebab-case, igual que el nombre del archivo
title: Minutes Watched per Plan
section: sql             # sql | algorithms | pandas | stats
difficulty: Easy         # Easy | Medium | Hard
topics: [JOIN, GROUP BY, Dates]
company: Lumora Stream   # empresa ficticia
order_matters: true      # solo SQL: true si el enunciado exige un ORDER BY concreto
---
```

### Secciones comunes

| Sección | Contenido |
| --- | --- |
| `## Statement` | Enunciado en Markdown (ejemplos y restricciones incluidos). |
| `## Hints` | Una o más pistas, cada una bajo un `### Hint N`. Se desbloquean de una en una. |
| `## Explanation` | Explicación paso a paso de la solución oficial. |

### Secciones de un problema SQL

| Sección | Contenido |
| --- | --- |
| `## Schema` | Un bloque ` ```sql ` con los `CREATE TABLE`. |
| `## Data` | Un bloque ` ```sql ` con los `INSERT` del dataset **visible** (se muestra en el enunciado y lo usa Run). |
| `## Hidden Data` | Uno o más bloques ` ```sql `; cada bloque es un dataset **oculto** completo (casos límite: NULLs, empates, bordes de fechas, grupos vacíos). Solo se usan en Submit. |
| `## Starter` | Un bloque ` ```sql ` con el código inicial del editor. |
| `## Solution` | Un bloque ` ```sql ` con la consulta oficial. Es la referencia con la que se compara tu resultado. |

> Los formatos de algoritmos, pandas y estadística se documentarán aquí cuando lleguen sus fases.

### Añadir un problema

1. Copia un archivo existente de la misma sección y cambia `id`, `slug` y el nombre del archivo.
2. Escribe el enunciado, los datos y la solución.
3. Ejecuta `npm test`: el problema se valida y la solución oficial se ejecuta contra todos los datasets.
4. `npm run dev` y ya aparece en la lista.

## Nota sobre los tests ocultos

Al no haber backend, los datasets ocultos y las soluciones viajan en el JavaScript que descarga
el navegador. La interfaz no los muestra, pero alguien que inspeccione el código podría verlos.
Para uso personal no es un problema.
