# QueryDojo

Web personal para preparar entrevistas técnicas (data engineer / data analyst / software engineer):
SQL, Python de algoritmos, pandas y estadística (105 problemas originales). **Todo se ejecuta en el navegador**: sin backend,
sin API keys, coste 0 €.

- **SQL:** PostgreSQL real en WebAssembly ([PGlite](https://pglite.dev)) dentro de un Web Worker.
- **Python:** [Pyodide](https://pyodide.org) (CPython en WebAssembly) en un Web Worker, cargado desde jsDelivr solo al abrir un problema de Python.
- **Progreso:** `localStorage` del navegador, con exportar/importar en JSON desde la página de Progreso.

Además de la lista de problemas hay **rutas de estudio** (una por sección, en orden de aprendizaje),
**modo entrevista** (problema al azar, 30 minutos, sin pistas, resumen al final), **problema del día**
y una página de **progreso** con rachas, calendario de actividad y temas débiles.

## Arrancar

Requisitos: Node 22 o superior (probado con Node 26, el de `.nvmrc`).

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # todo: formato, SQL y Python
npm run verify:sql     # solo SQL (PGlite)
npm run verify:python  # solo Python: algoritmos y pandas (Pyodide en Node)
npm run verify:stats   # solo estadística: recalcula cada respuesta numérica
npm run build      # build estático en dist/
npm run preview    # sirve dist/ en local
```

Atajos del editor: **⌘/Ctrl + Enter** ejecuta (Run) y **⌘/Ctrl + Shift + Enter** corrige (Submit).

## Estructura

```
problems/<sección>/<slug>.md   ← un archivo por problema (sql, algorithms, pandas, stats)
plugins/problems.ts            ← plugin de Vite: parsea los .md al compilar
src/lib/problems/              ← tipos, parser, índice (registry) y contenido por sección (content)
src/lib/sql/                   ← motor SQL compartido (engine.ts), worker y cliente
src/lib/python/harness.py      ← corrector de Python (el mismo en navegador y en Node)
src/lib/python/                ← worker de Pyodide, cliente con timeout y evaluador
src/lib/progress/, interview/  ← progreso, estadísticas, rachas y sesiones de entrevista
src/lib/paths.ts               ← rutas de estudio
src/components/, src/pages/    ← interfaz (React + Tailwind)
.github/workflows/deploy.yml   ← tests + build + publicación en GitHub Pages
tests/                         ← Vitest: formato de problemas y verificación de soluciones
```

Los problemas se parsean **al compilar**, no en el navegador: el plugin genera un índice ligero
(título, sección, dificultad, temas) que carga la portada, y un módulo por sección con el contenido
completo que se descarga al abrir el primer problema de esa sección. Un archivo mal formado rompe
`npm run dev`/`npm run build` con un mensaje que dice qué archivo y qué campo fallan.

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
| `## Wrong Answers` | *(Opcional, recomendado)* Uno o más bloques ` ```sql ` con errores típicos. No se muestran en la web: `npm test` comprueba que **todos** se rechazan en Submit, lo que demuestra que los datos ocultos cubren esos casos límite. |

### Cómo se corrige un problema SQL

- **Run** ejecuta tu consulta y la oficial sobre el dataset visible y compara.
- **Submit** hace lo mismo sobre el dataset visible y sobre cada dataset oculto, cada uno en una base de datos limpia.
- Se comparan los **nombres de columna en orden** (sin distinguir mayúsculas) y las **filas** como multiconjunto; el orden de filas solo cuenta si `order_matters: true`.
- Los números se comparan con tolerancia (`1e-6` relativa), así que `3`, `3.0` y `'3.00'::numeric` son iguales; un timestamp a medianoche equivale a la fecha (`2025-10-01 00:00:00` = `2025-10-01`).
- Si falla el caso visible verás un diff (filas que faltan / sobran); si falla uno oculto, solo el motivo (sin los datos).

### Problemas de algoritmos (Python)

Frontmatter adicional:

```yaml
function: gift_card_pair     # función que implementa el usuario
comparator: exact            # exact | unordered | unordered_deep | float | custom
tolerance: 1e-6              # solo para float
arg_types: [linked_list, null]   # opcional: convierte argumentos (linked_list | tree | null)
return_type: linked_list     # opcional: convierte el resultado a lista para comparar
time_limit_ms: 2000          # por caso (por defecto 2000)
complexity: { time: "O(n)", space: "O(n)" }
```

| Sección | Contenido |
| --- | --- |
| `## Starter` | Un bloque ` ```python ` con la firma de la función. |
| `## Tests` | Un bloque ` ```json `: lista de `{"args": [...], "expected": ...}`. Visibles (Run). |
| `## Hidden Tests` | *(Opcional)* Igual que Tests; si omites `expected`, se calcula con la solución oficial. |
| `## Generator` | *(Opcional)* Python con `def cases():` que hace `yield [args...]`. Sirve para casos grandes; el esperado se calcula con la solución oficial. Usa `random.Random(semilla)` para que sea determinista. |
| `## Checker` | *(Solo `comparator: custom`)* Python con `def check(got, expected, *args) -> bool`. |
| `## Solution` | Solución oficial en Python. |
| `## Wrong Answers` | *(Opcional, recomendado)* Soluciones incorrectas o lentas que los tests deben rechazar. |

Comparadores: `exact` (igualdad; las tuplas cuentan como listas y `True` ≠ `1`),
`unordered` (ignora el orden de la lista), `unordered_deep` (también el de cada sublista),
`float` (tolerancia), `custom` (tu `check`).

Listas enlazadas y árboles se escriben como listas JSON: `[1, 2, 3]` es `1 → 2 → 3` y
`[3, 9, 20, null, null, 15, 7]` es un árbol en orden por niveles. Las clases `ListNode` y
`TreeNode` están disponibles sin importar nada.

### Cómo se corrige un problema de Python

- **Run**: casos visibles, muestra entrada, esperado, obtenido, tus `print()` y las excepciones
  (solo con las líneas de tu código). Límite global: 5 s.
- **Submit**: visibles + ocultos + generados (grandes). Se detiene en el primer fallo y muestra
  ese caso. Límite por caso (`time_limit_ms`) y límite global de 10 s.
- Python no se puede interrumpir desde JavaScript sin cabeceras especiales que GitHub Pages no
  permite, así que si se supera el límite global se **termina el worker** y se arranca uno nuevo
  (botón **Reiniciar entorno** para hacerlo a mano).
- En Pyodide el límite de recursión es ~1000: en entradas grandes, usa versiones iterativas.

### Problemas de pandas

Frontmatter adicional: `function`, `order_matters` (por defecto `false`: las filas se comparan
ordenadas), `check_dtype` (por defecto `false`: `1` y `1.0` son iguales) y `tolerance`.

| Sección | Contenido |
| --- | --- |
| `## Starter` | Python con `import pandas as pd` y la firma de la función. |
| `## Data` | Python con `def cases():` que hace `yield [df1, df2, ...]` (los argumentos visibles). El primer caso se muestra en el enunciado. |
| `## Hidden Data` | Igual, con casos límite. Solo en Submit. |
| `## Solution` | Solución oficial: su resultado es el esperado. |
| `## Wrong Answers` | *(Opcional, recomendado)* Soluciones incorrectas que deben fallar. |

La corrección usa `pandas.testing.assert_frame_equal` después de comprobar columnas (nombres y
orden) y número de filas; el índice siempre se ignora. Con pandas 3, usa un formato de fecha
uniforme dentro de cada `pd.to_datetime([...])`.

### Problemas de estadística y probabilidad

```yaml
answer_type: numeric      # numeric | choice
answer: 0.141             # número, o índice (desde 0) de la opción correcta
tolerance: 0.002          # margen absoluto (solo numeric; por defecto 0.001)
```

| Sección | Contenido |
| --- | --- |
| `## Options` | *(Solo choice)* Una línea `- texto` por opción (Markdown). |
| `## Verification` | *(Obligatoria en numeric)* Python con `def answer():` que **recalcula** la respuesta; los tests comprueban que coincide con `answer`. |
| `## Explanation` | Explicación completa; se muestra al responder. |

El usuario puede responder con decimales (`0.375` o `0,375`), fracciones (`3/8`) o porcentajes
(`37.5%`).

### Añadir un problema

1. Copia un archivo existente de la misma sección y cambia `id`, `slug` y el nombre del archivo.
2. Escribe el enunciado, los datos, la solución y algunas respuestas incorrectas típicas.
   Ojo con YAML: en `topics`, palabras como `NULL`, `yes` o `no` hay que escribirlas entre comillas o con más texto.
3. Ejecuta `npm test`: el problema se valida y la solución oficial se ejecuta contra todos los datasets.
4. `npm run dev` y ya aparece en la lista.

## Publicar en GitHub Pages (gratis)

GitHub Pages es gratuito para repositorios **públicos**. El workflow `.github/workflows/deploy.yml`
se ejecuta en cada push a `main`: instala, pasa **todos los tests** (si alguno falla no se publica),
compila y despliega.

1. Crea el repositorio en GitHub y sube el código:
   ```bash
   gh repo create querydojo --public --source=. --push
   ```
2. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada push a `main` publica una versión nueva en `https://<usuario>.github.io/querydojo/`.
   También se puede lanzar a mano desde la pestaña **Actions** (*Run workflow*).

No hace falta configurar nada más: la app usa `HashRouter` (las URLs llevan `#/`, así que los enlaces
directos funcionan sin reescrituras del servidor) y `base: './'` (funciona bajo cualquier subruta).

El progreso se guarda por origen: el de `localhost:5173` y el de `github.io` son independientes.
Para pasarlo de uno a otro usa **Progreso → Exportar JSON** e **Importar JSON**.

## Nota sobre los tests ocultos

Al no haber backend, los datasets ocultos y las soluciones viajan en el JavaScript que descarga
el navegador. La interfaz no los muestra, pero alguien que inspeccione el código podría verlos.
Para uso personal no es un problema.
