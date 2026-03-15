# SIMBPR — Simulador de Pozos Petroleros

Simulador IPR (Inflow Performance Relationship) para análisis de pozos de aceite con modelo Vogel. Incluye gestión de proyectos, conversión de unidades, perfil de fondo (RPF) y análisis de sensibilidad.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| [Node.js](https://nodejs.org/) | 18 LTS o superior | https://nodejs.org/es/ |
| [Visual Studio Code](https://code.visualstudio.com/) | Cualquier versión reciente | https://code.visualstudio.com/ |
| [Git](https://git-scm.com/) | Cualquier versión reciente | https://git-scm.com/ |

---

## Abrir el proyecto en VS Code

### Opción A — Desde la terminal

```bash
# 1. Clona el repositorio
git clone https://github.com/sergioconrado/front-simbpr.git

# 2. Entra a la carpeta
cd front-simbpr

# 3. Abre VS Code
code .
```

### Opción B — Desde VS Code directamente

1. Abre VS Code.
2. Ve a **Archivo → Abrir carpeta…** (`Ctrl+K Ctrl+O` en Windows/Linux, `Cmd+K Cmd+O` en Mac).
3. Selecciona la carpeta `front-simbpr` que clonaste.
4. Haz clic en **Seleccionar carpeta**.

---

## Instalar dependencias

Abre la terminal integrada de VS Code (`Ctrl+ñ` o **Terminal → Nueva Terminal**) y ejecuta:

```bash
npm install
```

---

## Instalar extensiones recomendadas

Al abrir el proyecto VS Code detectará las extensiones recomendadas automáticamente. Si aparece el aviso, haz clic en **Instalar todo**. Si no aparece:

1. Abre la paleta de comandos (`Ctrl+Shift+P`).
2. Escribe `Show Recommended Extensions`.
3. Instala todas las que aparecen en la sección **WORKSPACE RECOMMENDATIONS**.

| Extensión | Para qué sirve |
|-----------|---------------|
| **Live Server** (`ritwickdey.LiveServer`) | Sirve el proyecto localmente con recarga automática |
| **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`) | Autocompletado de clases Tailwind |
| **Prettier** (`esbenp.prettier-vscode`) | Formatea el código al guardar |
| **ESLint** (`dbaeumer.vscode-eslint`) | Revisa errores en el JavaScript |
| **Path IntelliSense** (`christian-kohler.path-intellisense`) | Autocompletado de rutas de archivos |

---

## Ejecutar el proyecto

El archivo principal es `index.html`. Como usa módulos ES (`src/main.js`), **no se puede abrir directamente en el navegador** con `file://` — necesitas un servidor local.

### Opción 1 — Live Server (recomendado)

1. Asegúrate de tener la extensión **Live Server** instalada.
2. Abre `index.html` en el editor.
3. Haz clic en **Go Live** en la barra de estado inferior derecha de VS Code.
4. El navegador abrirá `http://127.0.0.1:5500` automáticamente.

### Opción 2 — npm serve

```bash
npm run serve
```

Abre `http://localhost:3000` en tu navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run serve` | Inicia un servidor local en `http://localhost:3000` |
| `npm run dev` | Compila el CSS de Tailwind en modo watch (recarga al guardar) |
| `npm run build` | Genera `output.css` minificado para producción |

---

## Estructura del proyecto

```
front-simbpr/
├── index.html              # Punto de entrada HTML
├── input.css               # CSS fuente de Tailwind
├── output.css              # CSS compilado (generado por npm run build)
├── logo-SIMBPR.png
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/                    # Código JavaScript (MVC)
    ├── main.js             # Punto de entrada JS — inicializa la app
    ├── models/             # Lógica de negocio (sin acceso al DOM)
    │   ├── IPRModel.js         Cálculos IPR Vogel
    │   ├── UnitModel.js        Conversión kg/cm² ↔ PSI
    │   ├── ProjectModel.js     Gestión de proyectos (CRUD)
    │   ├── ProductionModel.js  Cálculo de fluidos (Qo, Qw, Qg)
    │   ├── BSNModel.js         Bomba Sumergible (BSN)
    │   └── RPFModel.js         Perfil RPF y sensibilidad
    ├── views/              # Renderizado DOM (sin lógica de negocio)
    │   ├── ChartView.js        Gráficos con Chart.js
    │   ├── SimulatorView.js    Simulador IPR
    │   ├── ProjectView.js      Lista y formulario de proyectos
    │   └── AppView.js          Navegación y sub-nav
    └── controllers/        # Coordinan modelos y vistas
        ├── SimulatorController.js
        ├── ProjectController.js
        └── AppController.js
```

---

## Tecnologías

- **HTML5 / CSS3 / JavaScript ES2020** (sin framework)
- **Tailwind CSS 3** — utilidades CSS (vía CDN en desarrollo)
- **Chart.js** — gráficas IPR (vía CDN)
- **ES Modules** — organización modular del código JS
- **Arquitectura MVC** — separación de responsabilidades

---

## Notas

- El proyecto usa **Tailwind CDN** para desarrollo; no es necesario compilar CSS para ver la aplicación funcionando.
- Para producción, ejecuta `npm run build` y enlaza `output.css` en `index.html` en lugar del CDN.
- Los datos de proyectos se almacenan **solo en memoria** (se pierden al recargar la página). Una versión futura puede integrar `localStorage` o un backend.
