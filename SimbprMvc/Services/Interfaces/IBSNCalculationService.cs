using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services.Interfaces;

/// <summary>
/// Encapsulates Electric Submersible Pump (BSN/ESP) calculations.
/// Pure computation — no database access.
/// </summary>
public interface IBSNCalculationService
{
    BSNResultViewModel Calculate(int etapas, double freq, double hp, double volt, double amp);
}
