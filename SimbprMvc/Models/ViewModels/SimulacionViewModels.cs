using System.ComponentModel.DataAnnotations;

namespace SimbprMvc.Models.ViewModels;

// ── IPR ──────────────────────────────────────────────────────────────────

/// <summary>Form view model for IPR simulation inputs.</summary>
public class SimulacionIPRViewModel
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;

    [Display(Name = "Presión estática Pws")]
    [Range(0, double.MaxValue, ErrorMessage = "Pws debe ser ≥ 0")]
    public double Pws { get; set; }

    [Display(Name = "Presión de fondo fluyente Pwf")]
    [Range(0, double.MaxValue, ErrorMessage = "Pwf debe ser ≥ 0")]
    public double Pwf { get; set; }

    [Display(Name = "Caudal base Qb (bpd)")]
    [Range(0, double.MaxValue, ErrorMessage = "Qb debe ser ≥ 0")]
    public double Qb { get; set; }

    [Display(Name = "Índice de productividad J")]
    [Range(0, double.MaxValue, ErrorMessage = "J debe ser ≥ 0")]
    public double JIndex { get; set; } = 1.0;

    [Display(Name = "Unidad de presión")]
    public string Unidad { get; set; } = "kg";

    [Display(Name = "Color de curva")]
    public string IprColor { get; set; } = "#2563eb";

    // Computed results (populated by controller after calculation)
    public IPRResultViewModel? Resultado { get; set; }
}

/// <summary>Computed IPR results shown in the view.</summary>
public class IPRResultViewModel
{
    public double Qmax { get; set; }
    public double QOperacion { get; set; }
    public double PwfSistema { get; set; }
    public double J { get; set; }
    public string? Error { get; set; }
    public IReadOnlyList<ChartPointViewModel> CurvaIPR { get; set; } = [];
    public IReadOnlyList<ChartPointViewModel> LineaPwf { get; set; } = [];
    public IReadOnlyList<TablaIPRRow> Tabla { get; set; } = [];
}

public record ChartPointViewModel(double X, double Y);

public class TablaIPRRow
{
    public double Q { get; set; }
    public double Pwf { get; set; }
}

// ── Produccion ────────────────────────────────────────────────────────────

/// <summary>Form view model for fluid production inputs.</summary>
public class SimulacionProduccionViewModel
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;

    [Display(Name = "Caudal total Qt (bpd)")]
    [Range(0, double.MaxValue)]
    public double Qt { get; set; }

    [Display(Name = "BSW (%)")]
    [Range(0, 100)]
    public double Bsw { get; set; }

    [Display(Name = "Gravedad API")]
    [Range(0, double.MaxValue)]
    public double Api { get; set; } = 35.0;

    [Display(Name = "GOR (scf/bbl)")]
    [Range(0, double.MaxValue)]
    public double Gor { get; set; }

    [Display(Name = "Factor volumétrico Bo (rb/stb)")]
    [Range(0, double.MaxValue)]
    public double Bo { get; set; } = 1.0;

    // Computed results
    public ProduccionResultViewModel? Resultado { get; set; }
}

/// <summary>Computed production results.</summary>
public class ProduccionResultViewModel
{
    public double Qo { get; set; }
    public double Qw { get; set; }
    public double Qg { get; set; }
    public double Densidad { get; set; }
    public double QReservorio { get; set; }
}

// ── BSN ──────────────────────────────────────────────────────────────────

/// <summary>Form view model for ESP/BSN pump inputs.</summary>
public class SimulacionBSNViewModel
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;

    [Display(Name = "Número de etapas")]
    [Range(1, int.MaxValue)]
    public int Etapas { get; set; } = 120;

    [Display(Name = "Frecuencia (Hz)")]
    [Range(30, 90)]
    public double Freq { get; set; } = 60.0;

    [Display(Name = "Potencia del motor (HP)")]
    [Range(0, double.MaxValue)]
    public double Hp { get; set; } = 200.0;

    [Display(Name = "Voltaje del motor (V)")]
    [Range(0, double.MaxValue)]
    public double Volt { get; set; } = 1150.0;

    [Display(Name = "Corriente del motor (A)")]
    [Range(0, double.MaxValue)]
    public double Amp { get; set; } = 92.0;

    [Display(Name = "Profundidad de instalación (m)")]
    [Range(0, double.MaxValue)]
    public double Depth { get; set; } = 2200.0;

    [Display(Name = "Temperatura de fondo (°C)")]
    [Range(0, 300)]
    public double TempFondo { get; set; } = 90.0;

    // Computed results
    public BSNResultViewModel? Resultado { get; set; }
}

/// <summary>Computed BSN/ESP results.</summary>
public class BSNResultViewModel
{
    public double Cabeza { get; set; }
    public double Bhp { get; set; }
    public double Eficiencia { get; set; }
    public double CargaFactor { get; set; }
    public double PotenciaKw { get; set; }
}

// ── Simulador completo (dashboard) ───────────────────────────────────────

/// <summary>Aggregated view model passed to the Simulator dashboard view.</summary>
public class SimuladorViewModel
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public string ProyectoCliente { get; set; } = string.Empty;
    public string ProyectoEstado { get; set; } = "Activo";

    public SimulacionIPRViewModel IPR { get; set; } = new();
    public SimulacionProduccionViewModel Produccion { get; set; } = new();
    public SimulacionBSNViewModel BSN { get; set; } = new();
}
