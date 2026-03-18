using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services.Interfaces;

/// <summary>
/// Encapsulates the Vogel IPR model calculations.
/// Pure computation — no database access.
/// </summary>
public interface IIPRCalculationService
{
    /// <summary>
    /// Computes IPR curves and the operating point using the Vogel model.
    /// </summary>
    IPRResultViewModel Calculate(double pws, double pwf, double qb, double j, string unidad);
}
