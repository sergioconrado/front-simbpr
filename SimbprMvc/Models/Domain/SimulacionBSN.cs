using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimbprMvc.Models.Domain;

/// <summary>
/// Stores Electric Submersible Pump (BSN/ESP) simulation inputs per project.
/// Maps to dbo.SimulacionBSN in SQL Server.
/// </summary>
[Table("SimulacionBSN")]
public class SimulacionBSN
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [ForeignKey(nameof(Proyecto))]
    public int ProyectoId { get; set; }

    /// <summary>Number of pump stages</summary>
    public int Etapas { get; set; } = 120;

    /// <summary>Operating frequency (Hz)</summary>
    public double Freq { get; set; } = 60.0;

    /// <summary>Motor horsepower (HP)</summary>
    public double Hp { get; set; } = 200.0;

    /// <summary>Motor voltage (V)</summary>
    public double Volt { get; set; } = 1150.0;

    /// <summary>Motor amperage (A)</summary>
    public double Amp { get; set; } = 92.0;

    /// <summary>Pump setting depth (m)</summary>
    public double Depth { get; set; } = 2200.0;

    /// <summary>Bottom-hole temperature (°C)</summary>
    public double TempFondo { get; set; } = 90.0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Proyecto? Proyecto { get; set; }
}
