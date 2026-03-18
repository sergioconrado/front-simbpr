using SimbprMvc.Models.Domain;
using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services.Interfaces;

/// <summary>
/// Manages CRUD operations for well projects.
/// </summary>
public interface IProyectoService
{
    Task<IReadOnlyList<Proyecto>> GetAllAsync();
    Task<Proyecto?> GetByIdAsync(int id);
    Task<Proyecto> CreateAsync(ProyectoFormViewModel form);
    Task<Proyecto?> UpdateAsync(int id, ProyectoFormViewModel form);
    Task<Proyecto?> ToggleEstadoAsync(int id);
    Task<bool> DeleteAsync(int id);
}
