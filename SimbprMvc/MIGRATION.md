# SIMBPR — Guía de Migración a ASP.NET MVC (.NET 10)

## 1. Resumen ejecutivo

Este documento describe la migración del simulador de pozos petroleros **SIMBPR** desde su arquitectura original (JavaScript/Node.js/Express) hacia **ASP.NET Core MVC** con **.NET 10** y **Entity Framework Core 9** contra **SQL Server**.

---

## 2. Análisis de la arquitectura existente

| Capa           | Tecnología original              | Equivalente .NET                    |
|----------------|----------------------------------|-------------------------------------|
| Interfaz       | HTML + JavaScript (ES Modules)   | Razor Views (.cshtml)               |
| Lógica cliente | `src/models/*.js` (cálculos)     | `Services/` (C#, inyectados)        |
| Controladores  | `src/controllers/*.js`           | `Controllers/*.cs`                  |
| API REST       | Express 5 + Node.js              | ASP.NET Core MVC Controllers        |
| Base de datos  | `mssql` (npm) + SQL crudo        | Entity Framework Core + SQL Server  |
| Configuración  | `.env` / `dotenv`                | `appsettings.json` + `IConfiguration` |

---

## 3. Estructura del proyecto ASP.NET MVC (`SimbprMvc/`)

```
SimbprMvc/
├── Controllers/
│   ├── ProyectosController.cs     # CRUD de proyectos (lista, crear, editar, eliminar, toggle)
│   └── SimulacionController.cs    # Dashboard + IPR, Producción, BSN por proyecto
│
├── Models/
│   ├── Domain/                    # Entidades EF Core (se mapean a tablas SQL)
│   │   ├── Proyecto.cs
│   │   ├── SimulacionIPR.cs
│   │   ├── SimulacionProduccion.cs
│   │   └── SimulacionBSN.cs
│   └── ViewModels/                # DTOs para vistas y formularios
│       ├── ProyectoViewModels.cs
│       └── SimulacionViewModels.cs
│
├── Data/
│   ├── SimbprDbContext.cs         # EF Core DbContext + fluent configuration
│   └── Migrations/                # Migraciones de base de datos auto-generadas
│
├── Services/
│   ├── Interfaces/                # Contratos (SOLID: Dependency Inversion)
│   │   ├── IProyectoService.cs
│   │   ├── ISimulacionService.cs
│   │   ├── IIPRCalculationService.cs
│   │   ├── IProduccionCalculationService.cs
│   │   └── IBSNCalculationService.cs
│   ├── ProyectoService.cs         # Persistencia de proyectos vía EF Core
│   ├── SimulacionService.cs       # Upsert de datos de simulación
│   ├── IPRCalculationService.cs   # Modelo Vogel (puro, sin BD)
│   ├── ProduccionCalculationService.cs # Cálculos de fluidos
│   ├── BSNCalculationService.cs   # Leyes de afinidad para ESP/BSN
│   └── ProyectoMapper.cs         # Mapeo entidad → ViewModel
│
├── Views/
│   ├── Proyectos/
│   │   ├── Index.cshtml           # Tarjetas de todos los proyectos
│   │   ├── Create.cshtml          # Formulario de alta
│   │   ├── Edit.cshtml            # Formulario de edición
│   │   └── _ProyectoFormFields.cshtml  # Partial: campos reutilizables
│   ├── Simulacion/
│   │   ├── Index.cshtml           # Dashboard con pestañas (IPR / Prod / BSN)
│   │   ├── IPR.cshtml             # Vista individual IPR
│   │   ├── Produccion.cshtml      # Vista individual Producción
│   │   ├── BSN.cshtml             # Vista individual BSN
│   │   ├── _IPRPanel.cshtml       # Partial: formulario + resultados IPR
│   │   ├── _ProduccionPanel.cshtml # Partial: formulario + resultados producción
│   │   └── _BSNPanel.cshtml       # Partial: formulario + resultados BSN
│   └── Shared/
│       ├── _Layout.cshtml         # Plantilla base HTML (navbar, footer)
│       └── _ValidationScriptsPartial.cshtml
│
├── Program.cs                     # Arranque: DI, rutas, middleware
├── appsettings.json               # Producción: cadena de conexión
└── appsettings.Development.json   # Desarrollo: configuración local
```

---

## 4. Plan de migración paso a paso

### Paso 1 — Crear el proyecto ASP.NET MVC

```bash
dotnet new mvc -n SimbprMvc
cd SimbprMvc
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.*
dotnet add package Microsoft.EntityFrameworkCore.Design --version 9.*
```

### Paso 2 — Configurar la cadena de conexión

Edita `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<servidor>;Database=SIMBPR;User Id=<usuario>;Password=<contraseña>;TrustServerCertificate=true;"
  }
}
```

> **Seguridad**: Usa [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) en desarrollo:
> ```bash
> dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;..."
> ```

### Paso 3 — Crear/aplicar el esquema de base de datos

**Opción A** (si ya tienes la BD del proyecto Node.js):
El esquema de `server/schema.sql` es compatible. EF Core mapea las mismas tablas.

**Opción B** (BD nueva):
```bash
dotnet ef database update
```
Esto aplica la migración `InitialCreate` que crea exactamente las mismas tablas que `server/schema.sql`.

### Paso 4 — Registrar servicios en `Program.cs`

```csharp
builder.Services.AddDbContext<SimbprDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<ISimulacionService, SimulacionService>();
builder.Services.AddSingleton<IIPRCalculationService, IPRCalculationService>();
builder.Services.AddSingleton<IProduccionCalculationService, ProduccionCalculationService>();
builder.Services.AddSingleton<IBSNCalculationService, BSNCalculationService>();
```

### Paso 5 — Ejecutar la aplicación

```bash
cd SimbprMvc
dotnet run
# Navegar a http://localhost:5000
```

---

## 5. Ejemplo completo de una feature: Proyectos

### 5a. Controller (`ProyectosController.cs`)

```csharp
[HttpPost, ValidateAntiForgeryToken]
public async Task<IActionResult> Create(ProyectoFormViewModel form)
{
    if (!ModelState.IsValid) return View(form);
    await _proyectoService.CreateAsync(form);
    TempData["Success"] = $"Proyecto \"{form.Nombre}\" creado exitosamente.";
    return RedirectToAction(nameof(Index));
}
```

### 5b. Service (`ProyectoService.cs`)

```csharp
public async Task<Proyecto> CreateAsync(ProyectoFormViewModel form)
{
    var proyecto = new Proyecto
    {
        Nombre      = form.Nombre,
        Usuario     = form.Usuario,
        Cliente     = form.Cliente,
        Fecha       = DateTime.UtcNow.ToString("dd MMM yyyy"),
        Estado      = "Activo",
    };
    _db.Proyectos.Add(proyecto);
    await _db.SaveChangesAsync();
    return proyecto;
}
```

### 5c. View (`Proyectos/Create.cshtml`)

```razor
<form asp-action="Create" method="post">
    @Html.AntiForgeryToken()
    <input asp-for="Nombre" class="form-control" />
    <span asp-validation-for="Nombre" class="text-danger"></span>
    <button type="submit" class="btn btn-primary">Crear</button>
</form>
```

---

## 6. Configuración de rutas

En `Program.cs` se definen dos rutas convencionales:

```csharp
// Ruta especial para el simulador: /Simulacion/{proyectoId}/{action}
app.MapControllerRoute(
    name: "simulacion",
    pattern: "Simulacion/{proyectoId:int}/{action=Index}",
    defaults: new { controller = "Simulacion" });

// Ruta por defecto: Proyectos es la pantalla principal
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Proyectos}/{action=Index}/{id?}");
```

---

## 7. Inyección de dependencias

| Servicio                      | Ciclo de vida | Razón                                   |
|-------------------------------|---------------|-----------------------------------------|
| `SimbprDbContext`             | Scoped        | EF Core requiere un contexto por solicitud |
| `IProyectoService`            | Scoped        | Usa DbContext (Scoped)                  |
| `ISimulacionService`          | Scoped        | Usa DbContext (Scoped)                  |
| `IIPRCalculationService`      | Singleton     | Sin estado, cálculo puro                |
| `IProduccionCalculationService`| Singleton    | Sin estado, cálculo puro                |
| `IBSNCalculationService`      | Singleton     | Sin estado, cálculo puro                |

---

## 8. Breaking changes y riesgos

| Área                  | Riesgo                                                    | Mitigación                                                  |
|-----------------------|-----------------------------------------------------------|-------------------------------------------------------------|
| Gráficas Chart.js     | Los gráficos IPR son JavaScript — no migran a servidor    | Serializar `CurvaIPR` como JSON en la vista y usar Chart.js en el cliente |
| Unidades (kg/PSI)     | La conversión de unidades era reactiva en el cliente      | La conversión se hace en `IPRCalculationService` según el campo `Unidad` |
| Fechas                | La fecha se generaba en JS con `toLocaleDateString`       | Se genera en C# con `DateTime.UtcNow.ToString("dd MMM yyyy")` |
| Rate limiting         | `express-rate-limit` no existe en ASP.NET                 | Usar `AspNetCoreRateLimit` NuGet o middleware personalizado  |
| CORS                  | Express habilitaba CORS explícitamente                    | `builder.Services.AddCors()` si se necesita API separada    |
| Autenticación         | No había auth en la versión original                      | Agregar ASP.NET Core Identity si se requiere en el futuro   |
| Modo sin conexión     | El frontend JS tenía fallback offline                     | Implementar un mecanismo de caché si se requiere            |

---

## 9. Mejoras recomendadas (best practices)

1. **User Secrets** para contraseñas de BD en desarrollo (no en `appsettings.json`)
2. **Validación de modelos** ya implementada vía Data Annotations y `ModelState`
3. **async/await** en toda la capa de servicios y controladores
4. **SOLID**: interfaces para todos los servicios, implementaciones intercambiables
5. **Paginación** en `ProyectosController.Index` para listas grandes
6. **Logging estructurado** con `ILogger<T>` inyectado en servicios
7. **Health checks**: `builder.Services.AddHealthChecks().AddSqlServer(...)`
8. **Migrations en startup** (opcional):
   ```csharp
   using var scope = app.Services.CreateScope();
   await scope.ServiceProvider.GetRequiredService<SimbprDbContext>().Database.MigrateAsync();
   ```
9. **Response caching** para endpoints de solo lectura
10. **API Layer** opcional: agregar un `ApiController` que devuelva JSON para integrar con el frontend existente o aplicaciones móviles

---

## 10. Comparativa de tecnologías

| Aspecto           | Node.js/Express (anterior)  | ASP.NET Core MVC (nuevo)            |
|-------------------|-----------------------------|-------------------------------------|
| Lenguaje          | JavaScript (tipado dinámico) | C# (tipado estático, nullable refs) |
| ORM               | mssql (queries manuales)    | Entity Framework Core (LINQ)        |
| Validación        | Manual en controller        | Data Annotations + ModelState       |
| Vistas            | HTML estático + JS dinámico | Razor Views (server-side rendering) |
| DI                | No nativo                   | Nativo en ASP.NET Core              |
| Seguridad CSRF    | No implementado             | AntiForgeryToken nativo             |
| Testing           | Jest/Mocha                  | xUnit/NUnit/MSTest con EF InMemory  |
