using Microsoft.EntityFrameworkCore;
using SimbprMvc.Data;
using SimbprMvc.Models.Domain;
using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Services;

/// <summary>
/// Implements project CRUD against SQL Server via Entity Framework Core.
/// </summary>
public class ProyectoService : IProyectoService
{
    private static readonly string[] Estados = ["Activo", "En pausa", "Cerrado"];

    private readonly SimbprDbContext _db;

    public ProyectoService(SimbprDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Proyecto>> GetAllAsync()
        => await _db.Proyectos
            .OrderByDescending(p => p.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

    public async Task<Proyecto?> GetByIdAsync(int id)
        => await _db.Proyectos
            .Include(p => p.SimulacionIPR)
            .Include(p => p.SimulacionProduccion)
            .Include(p => p.SimulacionBSN)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<Proyecto> CreateAsync(ProyectoFormViewModel form)
    {
        var proyecto = new Proyecto
        {
            Nombre      = form.Nombre,
            Usuario     = form.Usuario,
            Compania    = form.Compania,
            Cliente     = form.Cliente,
            Orden       = form.Orden,
            Comentarios = form.Comentarios,
            Fecha       = DateTime.UtcNow.ToString("dd MMM yyyy"),
            Estado      = "Activo",
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow,
        };

        _db.Proyectos.Add(proyecto);
        await _db.SaveChangesAsync();
        return proyecto;
    }

    public async Task<Proyecto?> UpdateAsync(int id, ProyectoFormViewModel form)
    {
        var proyecto = await _db.Proyectos.FindAsync(id);
        if (proyecto is null) return null;

        proyecto.Nombre      = form.Nombre;
        proyecto.Usuario     = form.Usuario;
        proyecto.Compania    = form.Compania;
        proyecto.Cliente     = form.Cliente;
        proyecto.Orden       = form.Orden;
        proyecto.Comentarios = form.Comentarios;
        proyecto.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return proyecto;
    }

    public async Task<Proyecto?> ToggleEstadoAsync(int id)
    {
        var proyecto = await _db.Proyectos.FindAsync(id);
        if (proyecto is null) return null;

        var currentIdx = Array.IndexOf(Estados, proyecto.Estado);
        proyecto.Estado    = Estados[(currentIdx + 1) % Estados.Length];
        proyecto.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return proyecto;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var proyecto = await _db.Proyectos.FindAsync(id);
        if (proyecto is null) return false;

        _db.Proyectos.Remove(proyecto);
        await _db.SaveChangesAsync();
        return true;
    }
}
