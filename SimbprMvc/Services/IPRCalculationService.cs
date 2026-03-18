using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Services;

/// <summary>
/// Pure IPR (Vogel model) calculation service.
/// Ported from src/models/IPRModel.js — no database access.
/// </summary>
public class IPRCalculationService : IIPRCalculationService
{
    private const double KgCm2ToPsi = 14.2233;
    private const int CurvePoints = 200;
    private static readonly int[] TableIndices = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

    public IPRResultViewModel Calculate(double pws, double pwf, double qb, double j, string unidad)
    {
        // ── 1. Compute Qmax from Vogel calibration point ──────────────────
        double qmax;
        double jCalc = j;
        string? error = null;

        var qCalc = CalcQmaxVogel(pws, pwf, qb);
        if (qCalc.HasValue && qCalc.Value > 0)
        {
            qmax  = qCalc.Value;
            jCalc = (1.8 * qmax) / (pws > 0 ? pws : 1.0);
        }
        else
        {
            qmax  = (j * pws) / 1.8;
            error = "⚠ Parámetros inválidos para calibración (revisar Pws, Pwf, Qb).";
        }

        // ── 2. Generate IPR curve (CurvePoints + 1 points) ───────────────
        var ipr = Enumerable.Range(0, CurvePoints + 1)
            .Select(i =>
            {
                var pwfVal = pws * (1.0 - (double)i / CurvePoints);
                var r      = pwfVal / (pws > 0 ? pws : 1.0);
                var q      = Math.Max(qmax * (1.0 - 0.2 * r - 0.8 * r * r), 0.0);
                return (q, pwfVal);
            })
            .ToArray();

        // ── 3. Find operating point ───────────────────────────────────────
        double qOp = 0, diffMin = double.MaxValue;
        foreach (var (q, pwfVal) in ipr)
        {
            var diff = Math.Abs(pwfVal - pwf);
            if (diff < diffMin) { diffMin = diff; qOp = q; }
        }

        // ── 4. Convert to PSI if needed ───────────────────────────────────
        double pressureFactor = unidad.Equals("psi", StringComparison.OrdinalIgnoreCase)
            ? KgCm2ToPsi : 1.0;

        var curvaIPR = ipr
            .Select(p => new ChartPointViewModel(Math.Round(p.q, 2), Math.Round(p.pwfVal * pressureFactor, 2)))
            .ToList();

        var lineaPwf = ipr
            .Select(p => new ChartPointViewModel(Math.Round(p.q, 2), Math.Round(pwf * pressureFactor, 2)))
            .ToList();

        // ── 5. Build table (sampled at TableIndices) ──────────────────────
        var tabla = TableIndices
            .Select(idx => new TablaIPRRow
            {
                Q   = Math.Round(ipr[idx].q, 1),
                Pwf = Math.Round(ipr[idx].pwfVal * pressureFactor, 2),
            })
            .ToList();

        return new IPRResultViewModel
        {
            Qmax        = Math.Round(qmax, 1),
            QOperacion  = Math.Round(qOp, 1),
            PwfSistema  = Math.Round(pwf * pressureFactor, 2),
            J           = Math.Round(jCalc, 4),
            Error       = error,
            CurvaIPR    = curvaIPR,
            LineaPwf    = lineaPwf,
            Tabla       = tabla,
        };
    }

    /// <summary>
    /// Vogel: Qmax = Qb / (1 − 0.2·(Pwf/Pws) − 0.8·(Pwf/Pws)²)
    /// Returns null when parameters are invalid.
    /// </summary>
    private static double? CalcQmaxVogel(double pws, double pwf, double qb)
    {
        if (pws <= 0 || qb <= 0 || pwf < 0 || pwf > pws) return null;
        var a     = pwf / pws;
        var denom = 1.0 - 0.2 * a - 0.8 * a * a;
        return denom <= 0 ? null : qb / denom;
    }
}
