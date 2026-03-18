using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimbprMvc.Models.Domain;

/// <summary>
/// Stores IPR (Inflow Performance Relationship) simulation inputs per project.
/// Maps to dbo.SimulacionIPR in SQL Server.
/// </summary>
[Table("SimulacionIPR")]
public class SimulacionIPR
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [ForeignKey(nameof(Proyecto))]
    public int ProyectoId { get; set; }

    /// <summary>Static reservoir pressure (kg/cm² or PSI)</summary>
    public double Pws { get; set; }

    /// <summary>Flowing bottom-hole pressure at test point</summary>
    public double Pwf { get; set; }

    /// <summary>Test flow rate (bpd)</summary>
    public double Qb { get; set; }

    /// <summary>Productivity index (bpd / kg/cm²)</summary>
    public double JIndex { get; set; } = 1.0;

    /// <summary>Pressure unit: "kg" or "psi"</summary>
    [MaxLength(20)]
    public string Unidad { get; set; } = "kg";

    /// <summary>Chart line color (hex)</summary>
    [MaxLength(20)]
    public string IprColor { get; set; } = "#2563eb";

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Proyecto? Proyecto { get; set; }
}
