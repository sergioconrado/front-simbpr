using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimbprMvc.Models.Domain;

/// <summary>
/// Stores fluid production simulation inputs per project.
/// Maps to dbo.SimulacionProduccion in SQL Server.
/// </summary>
[Table("SimulacionProduccion")]
public class SimulacionProduccion
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [ForeignKey(nameof(Proyecto))]
    public int ProyectoId { get; set; }

    /// <summary>Total liquid rate (bpd)</summary>
    public double Qt { get; set; }

    /// <summary>Basic sediment and water percentage (0–100)</summary>
    public double Bsw { get; set; }

    /// <summary>API gravity of crude oil</summary>
    public double Api { get; set; } = 35.0;

    /// <summary>Gas-oil ratio (scf/bbl)</summary>
    public double Gor { get; set; }

    /// <summary>Oil formation volume factor (rb/stb)</summary>
    public double Bo { get; set; } = 1.0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Proyecto? Proyecto { get; set; }
}
