using Microsoft.EntityFrameworkCore;
using SimbprMvc.Data;
using SimbprMvc.Models.Domain;
using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Services;

/// <summary>
/// Persists and retrieves simulation inputs per project using an upsert strategy.
/// </summary>
public class SimulacionService : ISimulacionService
{
    private readonly SimbprDbContext _db;

    public SimulacionService(SimbprDbContext db)
    {
        _db = db;
    }

    // ── IPR ──────────────────────────────────────────────────────────────

    public async Task<SimulacionIPR?> GetIPRAsync(int proyectoId)
        => await _db.SimulacionesIPR
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

    public async Task<SimulacionIPR> UpsertIPRAsync(int proyectoId, SimulacionIPRViewModel vm)
    {
        var existing = await _db.SimulacionesIPR
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

        if (existing is null)
        {
            existing = new SimulacionIPR { ProyectoId = proyectoId };
            _db.SimulacionesIPR.Add(existing);
        }

        existing.Pws       = vm.Pws;
        existing.Pwf       = vm.Pwf;
        existing.Qb        = vm.Qb;
        existing.JIndex    = vm.JIndex;
        existing.Unidad    = vm.Unidad;
        existing.IprColor  = vm.IprColor;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }

    // ── Produccion ────────────────────────────────────────────────────────

    public async Task<SimulacionProduccion?> GetProduccionAsync(int proyectoId)
        => await _db.SimulacionesProduccion
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

    public async Task<SimulacionProduccion> UpsertProduccionAsync(int proyectoId, SimulacionProduccionViewModel vm)
    {
        var existing = await _db.SimulacionesProduccion
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

        if (existing is null)
        {
            existing = new SimulacionProduccion { ProyectoId = proyectoId };
            _db.SimulacionesProduccion.Add(existing);
        }

        existing.Qt        = vm.Qt;
        existing.Bsw       = vm.Bsw;
        existing.Api       = vm.Api;
        existing.Gor       = vm.Gor;
        existing.Bo        = vm.Bo;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }

    // ── BSN ───────────────────────────────────────────────────────────────

    public async Task<SimulacionBSN?> GetBSNAsync(int proyectoId)
        => await _db.SimulacionesBSN
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

    public async Task<SimulacionBSN> UpsertBSNAsync(int proyectoId, SimulacionBSNViewModel vm)
    {
        var existing = await _db.SimulacionesBSN
            .FirstOrDefaultAsync(s => s.ProyectoId == proyectoId);

        if (existing is null)
        {
            existing = new SimulacionBSN { ProyectoId = proyectoId };
            _db.SimulacionesBSN.Add(existing);
        }

        existing.Etapas    = vm.Etapas;
        existing.Freq      = vm.Freq;
        existing.Hp        = vm.Hp;
        existing.Volt      = vm.Volt;
        existing.Amp       = vm.Amp;
        existing.Depth     = vm.Depth;
        existing.TempFondo = vm.TempFondo;
        existing.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return existing;
    }
}
