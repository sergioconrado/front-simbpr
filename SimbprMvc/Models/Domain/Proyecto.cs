using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SimbprMvc.Models.Domain;

/// <summary>
/// Represents a well project in the SIMBPR system.
/// Maps to dbo.Proyectos in SQL Server.
/// </summary>
[Table("Proyectos")]
public class Proyecto
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Usuario { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Compania { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Cliente { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Orden { get; set; } = string.Empty;

    public string Comentarios { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Fecha { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Estado { get; set; } = "Activo";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public SimulacionIPR? SimulacionIPR { get; set; }
    public SimulacionProduccion? SimulacionProduccion { get; set; }
    public SimulacionBSN? SimulacionBSN { get; set; }
}
