# 🚀 INICIO RÁPIDO — Cómo abrir SIMBPR en VS Code

> Esta guía está escrita **paso a paso** para alguien que nunca ha usado VS Code o Git.  
> Sigue cada paso en orden y no te saltes ninguno.

---

## Paso 1 — Instala las herramientas necesarias

Antes de poder abrir el proyecto necesitas tener instaladas tres herramientas. Si ya las tienes, salta al **Paso 2**.

### 1a. Instala Node.js

1. Ve a **https://nodejs.org/es/**
2. Descarga la versión **"LTS"** (la recomendada, dice algo como "18.x.x LTS").
3. Abre el instalador descargado y sigue los pasos (acepta todo y haz clic en "Siguiente").
4. Cuando termine, abre la terminal de tu sistema:
   - **Windows**: presiona `Windows + R`, escribe `cmd` y presiona Enter.
   - **Mac**: abre **Spotlight** (`Cmd + Espacio`), escribe `Terminal` y presiona Enter.
5. Escribe el siguiente comando para verificar que se instaló bien:
   ```
   node --version
   ```
   Debes ver algo como `v18.20.4`. Si ves un número, ¡está bien!

---

### 1b. Instala Git

1. Ve a **https://git-scm.com/**
2. Haz clic en el botón de descarga para tu sistema operativo.
3. Abre el instalador y acepta todas las opciones por defecto (solo haz clic en "Next"/"Siguiente" en todo).
4. Verifica la instalación en la terminal:
   ```
   git --version
   ```
   Debes ver algo como `git version 2.43.0`.

---

### 1c. Instala Visual Studio Code (VS Code)

1. Ve a **https://code.visualstudio.com/**
2. Haz clic en el botón azul de descarga.
3. Abre el instalador. **Importante**: en la pantalla de opciones, marca ✅ la casilla que dice:
   > "Agregar la acción 'Abrir con Code' al menú contextual del Explorador de archivos"
4. Finaliza la instalación.

---

## Paso 2 — Descarga (clona) el proyecto

El proyecto vive en GitHub. "Clonar" significa descargar una copia en tu computadora.

1. Abre la terminal (la misma que usaste en el Paso 1).

2. Decide **dónde** quieres guardar el proyecto. Puedes ir a tus Documentos escribiendo:
   ```
   cd Documents
   ```
   *(en Mac/Linux sería `cd ~/Documents`)*

3. Ahora descarga el proyecto con este comando exacto:
   ```
   git clone https://github.com/sergioconrado/front-simbpr.git
   ```

4. Espera a que termine. Verás varios mensajes. Cuando regrese el cursor (el símbolo `>`), habrá terminado.

5. Entra a la carpeta del proyecto:
   ```
   cd front-simbpr
   ```

---

## Paso 3 — Abre el proyecto en VS Code

Tienes **dos formas** de hacerlo. Elige la que prefieras:

---

### ✅ Forma A — Desde la terminal (la más rápida)

Con la terminal abierta **dentro de la carpeta `front-simbpr`** (la dejaste ahí al final del Paso 2), escribe:

```
code .
```

> El punto `.` significa "esta carpeta". VS Code se abrirá automáticamente con todo el proyecto cargado.

---

### ✅ Forma B — Abriendo el archivo del espacio de trabajo

Dentro de la carpeta `front-simbpr` que descargaste verás un archivo llamado **`simbpr.code-workspace`**.

1. Haz **doble clic** en ese archivo.
2. VS Code se abrirá directamente con el proyecto configurado y listo.

---

### ✅ Forma C — Desde VS Code con el menú

1. Abre VS Code (búscalo en tus programas instalados).
2. En el menú superior haz clic en:  
   **Archivo → Abrir carpeta…**  
   *(en inglés: File → Open Folder…)*
3. En la ventana que se abre, navega hasta donde clonaste el proyecto (por ejemplo `Documentos/front-simbpr`).
4. Haz clic **una sola vez** sobre la carpeta `front-simbpr` para seleccionarla.
5. Haz clic en el botón **"Seleccionar carpeta"** (o "Open" en inglés).

---

## Paso 4 — Instala las extensiones recomendadas

Cuando abras el proyecto, VS Code puede mostrar un aviso como este en la esquina inferior derecha:

> *"This workspace has extension recommendations. Do you want to install them?"*

**Haz clic en "Install All" (Instalar todo).**

Si el aviso **no aparece**:

1. Presiona las teclas `Ctrl + Shift + P` (en Mac: `Cmd + Shift + P`).  
   Esto abre la "paleta de comandos" — una barra de búsqueda de acciones.
2. Escribe:  
   ```
   Show Recommended Extensions
   ```
3. Presiona **Enter**.
4. En el panel que se abre, verás una lista. Haz clic en el botón de nube/descarga ☁ junto a cada extensión para instalarla.

Las extensiones más importantes son:

| Nombre | Para qué sirve |
|--------|---------------|
| **Live Server** | Para ver la app en el navegador con actualización automática |
| **Tailwind CSS IntelliSense** | Autocompletado de estilos |
| **Prettier** | Formatea el código automáticamente al guardar |
| **SQL Server (mssql)** | Para conectarte a la base de datos desde VS Code |

---

## Paso 5 — Instala las dependencias del proyecto

El proyecto usa librerías de Node.js que hay que descargar una sola vez.

1. En VS Code, abre la **terminal integrada**:  
   - Haz clic en el menú **Terminal → Nueva terminal**  
   - O presiona `` Ctrl + ` `` (la tecla del acento grave, a la izquierda del `1`)

2. En esa terminal escribe:
   ```
   npm install
   ```

3. Espera a que termine. Verás mensajes de descarga. Cuando regrese el cursor (el símbolo `>`), habrá terminado.

> ⚠️ Solo necesitas hacer esto **una vez** cuando descargas el proyecto por primera vez.

---

## Paso 6 — Ejecuta el proyecto

### Opción A — Con base de datos SQL Server

> Esta opción guarda los proyectos permanentemente. Requiere que tengas SQL Server instalado.  
> Si no tienes SQL Server todavía, usa la **Opción B**.

1. Copia el archivo de configuración:  
   En la terminal integrada de VS Code escribe:
   ```
   cp server/.env.example server/.env
   ```
   *(En Windows usa `copy server\.env.example server\.env`)*

2. Abre el archivo `server/.env` en VS Code (aparece en el explorador de archivos de la izquierda, dentro de la carpeta `server`).

3. Cambia los valores por los datos de tu SQL Server:
   ```env
   DB_SERVER=localhost
   DB_PORT=1433
   DB_DATABASE=SIMBPR
   DB_USER=sa
   DB_PASSWORD=TuContraseñaReal
   ```

4. Inicia el servidor:
   ```
   npm start
   ```

5. Abre tu navegador y ve a: **http://localhost:3001**

---

### Opción B — Sin base de datos (modo rápido / solo para ver la interfaz)

1. En el explorador de VS Code (panel izquierdo), haz clic en el archivo `index.html`.

2. En la barra azul de la parte **inferior** de VS Code busca el botón que dice **"Go Live"** y haz clic en él.

3. Tu navegador se abrirá automáticamente con la aplicación.

> En este modo la app funciona normalmente **pero los proyectos no se guardan** si recargas la página.

---

## 🎉 ¡Listo!

Si llegaste hasta aquí, el proyecto está abierto y funcionando en VS Code.  
Para la próxima vez que quieras trabajar en él solo necesitas:

1. Abrir la terminal.
2. Ir a la carpeta: `cd Documents/front-simbpr`
3. Abrir VS Code: `code .`
4. Iniciar el servidor: `npm start`

---

## ❓ Solución de problemas frecuentes

| Problema | Solución |
|----------|---------|
| `'code' is not recognized` | Cierra y vuelve a abrir la terminal después de instalar VS Code. Si sigue fallando, abre VS Code manualmente y usa **Ctrl+Shift+P → Shell Command: Install 'code' command in PATH** |
| `'git' is not recognized` | Reinicia la terminal después de instalar Git |
| `'node' is not recognized` | Reinicia la terminal después de instalar Node.js |
| `npm install` da errores de permisos | En Windows: abre la terminal como Administrador. En Mac: usa `sudo npm install` |
| El botón "Go Live" no aparece | Instala la extensión **Live Server** (ver Paso 4) |
| Puerto 3001 en uso | Abre `server/.env`, cambia `PORT=3001` a `PORT=3002` y reinicia con `npm start` |
| VS Code está en inglés | Ve a **Ctrl+Shift+P → Configure Display Language → Español** |
