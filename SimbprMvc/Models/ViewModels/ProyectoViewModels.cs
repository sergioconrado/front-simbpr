using System.ComponentModel.DataAnnotations;

namespace SimbprMvc.Models.ViewModels;

/// <summary>
/// View model for creating or editing a Proyecto.
/// Carries both the form data and any validation messages.
/// </summary>
public class ProyectoFormViewModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "El nombre del proyecto es requerido.")]
    [MaxLength(255)]
    [Display(Name = "Nombre del proyecto")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del usuario es requerido.")]
    [MaxLength(255)]
    [Display(Name = "Usuario / Ingeniero")]
    public string Usuario { get; set; } = string.Empty;

    [MaxLength(255)]
    [Display(Name = "Compañía")]
    public string Compania { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre del cliente es requerido.")]
    [MaxLength(255)]
    [Display(Name = "Cliente")]
    public string Cliente { get; set; } = string.Empty;

    [MaxLength(100)]
    [Display(Name = "Orden de trabajo")]
    public string Orden { get; set; } = string.Empty;

    [Display(Name = "Comentarios")]
    public string Comentarios { get; set; } = string.Empty;
}

/// <summary>
/// View model for displaying a list of projects.
/// </summary>
public class ProyectosListViewModel
{
    public IReadOnlyList<ProyectoItemViewModel> Proyectos { get; set; } = [];
}

/// <summary>
/// View model for a single project card in the list.
/// </summary>
public class ProyectoItemViewModel
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Usuario { get; set; } = string.Empty;
    public string Compania { get; set; } = string.Empty;
    public string Cliente { get; set; } = string.Empty;
    public string Orden { get; set; } = string.Empty;
    public string Fecha { get; set; } = string.Empty;
    public string Estado { get; set; } = "Activo";
    public string Iniciales { get; set; } = string.Empty;
    public string AvatarColor { get; set; } = "bg-blue-200";
    public string EstadoBgColor { get; set; } = "bg-green-100";
    public string EstadoTextColor { get; set; } = "text-green-700";
}
