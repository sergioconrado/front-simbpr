using SimbprMvc.Models.Domain;
using SimbprMvc.Models.ViewModels;

namespace SimbprMvc.Services;

/// <summary>
/// Maps domain entities to view models.
/// Keeps controllers lean by centralising projection logic.
/// </summary>
public static class ProyectoMapper
{
    private static readonly string[] AvatarColors =
    [
        "bg-blue-200", "bg-violet-200", "bg-emerald-200",
        "bg-rose-200",  "bg-amber-200",  "bg-cyan-200",
    ];

    private static readonly Dictionary<string, (string Bg, string Text)> EstadoColors = new()
    {
        ["Activo"]    = ("bg-green-100", "text-green-700"),
        ["En pausa"]  = ("bg-amber-100", "text-amber-700"),
        ["Cerrado"]   = ("bg-gray-100",  "text-gray-500"),
    };

    public static ProyectoItemViewModel ToItemViewModel(Proyecto p, int index)
    {
        var (bg, text) = EstadoColors.TryGetValue(p.Estado, out var c) ? c : ("bg-gray-100", "text-gray-500");
        return new ProyectoItemViewModel
        {
            Id               = p.Id,
            Nombre           = p.Nombre,
            Usuario          = p.Usuario,
            Compania         = p.Compania,
            Cliente          = p.Cliente,
            Orden            = p.Orden,
            Fecha            = p.Fecha,
            Estado           = p.Estado,
            Iniciales        = GetInitials(p.Nombre),
            AvatarColor      = AvatarColors[index % AvatarColors.Length],
            EstadoBgColor    = bg,
            EstadoTextColor  = text,
        };
    }

    public static ProyectoFormViewModel ToFormViewModel(Proyecto p) => new()
    {
        Id          = p.Id,
        Nombre      = p.Nombre,
        Usuario     = p.Usuario,
        Compania    = p.Compania,
        Cliente     = p.Cliente,
        Orden       = p.Orden,
        Comentarios = p.Comentarios,
    };

    private static string GetInitials(string nombre)
        => string.Concat(
            nombre.Trim()
                  .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                  .Take(2)
                  .Select(w => char.ToUpperInvariant(w[0])));
}
