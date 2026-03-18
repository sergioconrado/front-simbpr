using SimbprMvc.Models.Domain;
using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services.Interfaces;

/// <summary>
/// Manages persistence and retrieval of simulation data for a project.
/// </summary>
public interface ISimulacionService
{
    Task<SimulacionIPR?> GetIPRAsync(int proyectoId);
    Task<SimulacionProduccion?> GetProduccionAsync(int proyectoId);
    Task<SimulacionBSN?> GetBSNAsync(int proyectoId);

    Task<SimulacionIPR> UpsertIPRAsync(int proyectoId, SimulacionIPRViewModel vm);
    Task<SimulacionProduccion> UpsertProduccionAsync(int proyectoId, SimulacionProduccionViewModel vm);
    Task<SimulacionBSN> UpsertBSNAsync(int proyectoId, SimulacionBSNViewModel vm);
}
