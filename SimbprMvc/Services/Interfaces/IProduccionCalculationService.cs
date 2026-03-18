using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services.Interfaces;

/// <summary>
/// Encapsulates fluid production calculations.
/// Pure computation — no database access.
/// </summary>
public interface IProduccionCalculationService
{
    ProduccionResultViewModel Calculate(double qt, double bsw, double api, double gor, double bo);
}
