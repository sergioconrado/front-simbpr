# SIMBPR — Simulador de Pozos Petroleros

Simulador IPR (Inflow Performance Relationship) para análisis de pozos de aceite con modelo Vogel. Incluye gestión de proyectos, conversión de unidades, perfil de fondo (RPF) y análisis de sensibilidad.

Los proyectos se persisten en **SQL Server** a través de una API REST incluida en el propio repositorio.

---

> ### 👋 ¿Es tu primera vez aquí?
> Consulta la **[Guía de Inicio Rápido para Principiantes → INICIO-RAPIDO.md](./INICIO-RAPIDO.md)**  
> Te explica paso a paso cómo instalar las herramientas, descargar el proyecto y abrirlo en VS Code.

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| [Node.js](https://nodejs.org/) | 18 LTS o superior | https://nodejs.org/es/ |
| [Visual Studio Code](https://code.visualstudio.com/) | Cualquier versión reciente | https://code.visualstudio.com/ |
| [Git](https://git-scm.com/) | Cualquier versión reciente | https://git-scm.com/ |
| **SQL Server** | 2016+ o Azure SQL Database | https://www.microsoft.com/es-mx/sql-server/sql-server-downloads |

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

## Configurar SQL Server

### 1. Crear la base de datos

En SQL Server Management Studio (SSMS) o Azure Data Studio, ejecuta:

```sql
CREATE DATABASE SIMBPR;
```

### 2. Crear las tablas

Abre el archivo `server/schema.sql` en SSMS y ejecútalo contra la base de datos `SIMBPR`. Esto crea las cuatro tablas:

| Tabla | Contenido |
|-------|-----------|
| `Proyectos` | Nombre, usuario, cliente, estado, fecha, etc. |
| `SimulacionIPR` | Parámetros de la curva IPR (Pws, Pwf, Qb, J, unidad, color) |
| `SimulacionProduccion` | Qt, BSW, API, GOR, Bo |
| `SimulacionBSN` | Etapas, frecuencia, HP, voltaje, amperaje, profundidad |

### 3. Configurar la conexión

```bash
# Copia el archivo de ejemplo
cp server/.env.example server/.env

# Edita server/.env con tus credenciales de SQL Server
```

Ejemplo de `server/.env`:

```env
DB_SERVER=localhost
DB_PORT=1433
DB_DATABASE=SIMBPR
DB_USER=sa
DB_PASSWORD=TuContraseña
DB_WINDOWS_AUTH=false
PORT=3001
```

> **Seguridad**: El archivo `server/.env` está en `.gitignore` y **nunca** se sube al repositorio.

---

## Ejecutar el proyecto

### Modo desarrollo (recomendado)

Necesitas **dos terminales**:

**Terminal 1 — API + frontend (Express)**
```bash
npm start
```
Esto inicia el servidor en `http://localhost:3001`. Abre esa URL en tu navegador.

**Terminal 2 — Compilación CSS en modo watch (opcional)**
```bash
npm run dev:css
```

### Modo Live Server (sin base de datos / solo pruebas de UI)

1. Abre `index.html` en VS Code.
2. Haz clic en **Go Live** en la barra de estado inferior derecha.
3. La app funciona pero **sin persistencia** (los proyectos no se guardan al recargar).
4. El servidor Express no es necesario en este modo; los errores de conexión al API se muestran solo en la consola del navegador.

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor Express (API + frontend estático) en `:3001` |
| `npm run dev:css` | Compila Tailwind en modo watch |
| `npm run build` | Genera `output.css` minificado para producción |
| `npm run serve` | Inicia un servidor estático simple en `:3000` (sin API) |

---

## API REST

El servidor expone los siguientes endpoints en `/api`:

### Proyectos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/proyectos` | Lista todos los proyectos |
| `POST` | `/api/proyectos` | Crea un nuevo proyecto |
| `GET` | `/api/proyectos/:id` | Obtiene un proyecto por ID |
| `PUT` | `/api/proyectos/:id` | Actualiza un proyecto |
| `PATCH` | `/api/proyectos/:id/estado` | Rota el estado (Activo → En pausa → Cerrado) |
| `DELETE` | `/api/proyectos/:id` | Elimina un proyecto |

### Datos de simulación por proyecto

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/proyectos/:id/simulacion` | Obtiene todos los datos de simulación |
| `PUT` | `/api/proyectos/:id/simulacion/ipr` | Guarda/actualiza datos IPR |
| `PUT` | `/api/proyectos/:id/simulacion/produccion` | Guarda/actualiza datos de producción |
| `PUT` | `/api/proyectos/:id/simulacion/bsn` | Guarda/actualiza datos BSN |

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
├── server/                 # Backend Node.js + Express
│   ├── index.js            # Servidor Express (API + static files)
│   ├── db.js               # Pool de conexiones SQL Server (mssql)
│   ├── schema.sql          # DDL — crea las 4 tablas en SQL Server
│   ├── .env.example        # Plantilla de variables de entorno
│   └── routes/
│       ├── proyectos.js    # CRUD REST /api/proyectos
│       └── simulaciones.js # /api/proyectos/:id/simulacion/*
└── src/                    # Código JavaScript frontend (MVC)
    ├── main.js             # Punto de entrada JS — inicializa la app
    ├── services/
    │   └── ApiService.js   # Cliente fetch() para la API REST
    ├── models/             # Lógica de negocio (sin acceso al DOM)
    │   ├── IPRModel.js         Cálculos IPR Vogel
    │   ├── UnitModel.js        Conversión kg/cm² ↔ PSI
    │   ├── ProjectModel.js     Gestión de proyectos (cache + API)
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

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 / CSS3 / JavaScript ES2020 (sin framework) |
| Estilos | Tailwind CSS 3 |
| Gráficas | Chart.js (vía CDN) |
| Módulos JS | ES Modules nativos |
| Backend | Node.js + Express 5 |
| Base de datos | SQL Server 2016+ / Azure SQL |
| Driver DB | mssql (node-mssql) |
| Arquitectura | MVC (frontend) + REST API (backend) |

---

## Notas

- La app funciona en modo **sin conexión** si el servidor API no está disponible: los proyectos no se guardan pero la simulación IPR sigue funcionando.
- Para producción, ejecuta `npm run build` para generar el CSS minificado.
- Las credenciales de SQL Server deben estar **siempre** en `server/.env` (nunca en el código).

