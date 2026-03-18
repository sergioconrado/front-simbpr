using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Services;

/// <summary>
/// Pure fluid production calculation service.
/// Ported from src/models/ProductionModel.js.
/// </summary>
public class ProduccionCalculationService : IProduccionCalculationService
{
    public ProduccionResultViewModel Calculate(double qt, double bsw, double api, double gor, double bo)
    {
        var qo    = qt * (1.0 - bsw / 100.0);
        var qw    = qt * (bsw / 100.0);
        var qg    = (qo * gor) / 1000.0;           // Mscf/d
        var dens  = 141.5 / (api + 131.5);          // g/cc (API formula)
        var qRes  = qo * bo;                         // rb/d in reservoir

        return new ProduccionResultViewModel
        {
            Qo          = Math.Round(qo,   2),
            Qw          = Math.Round(qw,   2),
            Qg          = Math.Round(qg,   4),
            Densidad    = Math.Round(dens, 4),
            QReservorio = Math.Round(qRes, 2),
        };
    }
}
