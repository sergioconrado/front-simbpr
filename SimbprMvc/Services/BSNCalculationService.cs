using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Services;

/// <summary>
/// Pure Electric Submersible Pump (BSN/ESP) calculation service.
/// Ported from src/models/BSNModel.js — affinity laws, base frequency 60 Hz.
/// </summary>
public class BSNCalculationService : IBSNCalculationService
{
    public BSNResultViewModel Calculate(int etapas, double freq, double hp, double volt, double amp)
    {
        // Affinity laws: H ∝ (n/n0)²
        var factorH = (freq / 60.0) * (freq / 60.0);

        // Typical head per stage ≈ 8 m at BEP (60 Hz)
        var cabeza = etapas * 8.0 * factorH;

        // BHP = HP × 0.80 (mechanical losses ~20 %)
        var bhp = hp * 0.80;

        // Hydraulic efficiency: scales with frequency, base 67 %
        var efic = 67.0 * factorH;

        // Load factor = BHP / installed HP
        var carga = hp > 0 ? (bhp / hp) * 100.0 : 0.0;

        // Electrical power = √3 × V × I × PF (PF ≈ 0.85)
        var kw = (Math.Sqrt(3.0) * volt * amp * 0.85) / 1000.0;

        return new BSNResultViewModel
        {
            Cabeza       = Math.Round(cabeza, 1),
            Bhp          = Math.Round(bhp,   1),
            Eficiencia   = Math.Round(efic,  1),
            CargaFactor  = Math.Round(carga, 1),
            PotenciaKw   = Math.Round(kw,    2),
        };
    }
}
