using Microsoft.EntityFrameworkCore;
using SimbprMvc.Data;
using SimbprMvc.Services;
using SimbprMvc.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// ── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<SimbprDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure()));

// ── Application services (Dependency Injection) ───────────────────────────
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<ISimulacionService, SimulacionService>();

// Calculation services are stateless — register as singletons for efficiency
builder.Services.AddSingleton<IIPRCalculationService, IPRCalculationService>();
builder.Services.AddSingleton<IProduccionCalculationService, ProduccionCalculationService>();
builder.Services.AddSingleton<IBSNCalculationService, BSNCalculationService>();

// ── MVC ───────────────────────────────────────────────────────────────────
builder.Services.AddControllersWithViews();

var app = builder.Build();

// ── HTTP pipeline ─────────────────────────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Proyectos/Index");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.MapStaticAssets();

// ── Routing ───────────────────────────────────────────────────────────────
// Route 1: Simulacion uses proyectoId as the primary key parameter
app.MapControllerRoute(
    name: "simulacion",
    pattern: "Simulacion/{proyectoId:int}/{action=Index}",
    defaults: new { controller = "Simulacion" });

// Route 2: Standard MVC default route — Proyectos is the landing page
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Proyectos}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();

