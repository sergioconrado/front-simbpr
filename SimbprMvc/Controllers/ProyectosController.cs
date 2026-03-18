using Microsoft.AspNetCore.Mvc;
using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Controllers;

/// <summary>
/// Handles project management: listing, creating, editing, deleting, and toggling status.
/// GET  /Proyectos          — List all projects
/// GET  /Proyectos/Create   — Show create form
/// POST /Proyectos/Create   — Save new project
/// GET  /Proyectos/Edit/5   — Show edit form
/// POST /Proyectos/Edit/5   — Save changes
/// POST /Proyectos/Delete/5 — Delete project
/// POST /Proyectos/Toggle/5 — Cycle project status
/// </summary>
public class ProyectosController : Controller
{
    private readonly IProyectoService _proyectoService;

    public ProyectosController(IProyectoService proyectoService)
    {
        _proyectoService = proyectoService;
    }

    // ── GET /Proyectos ────────────────────────────────────────────────────

    public async Task<IActionResult> Index()
    {
        var proyectos = await _proyectoService.GetAllAsync();

        var vm = new ProyectosListViewModel
        {
            Proyectos = proyectos
                .Select((p, i) => ProyectoMapper.ToItemViewModel(p, i))
                .ToList(),
        };

        return View(vm);
    }

    // ── GET /Proyectos/Create ─────────────────────────────────────────────

    public IActionResult Create()
        => View(new ProyectoFormViewModel());

    // ── POST /Proyectos/Create ────────────────────────────────────────────

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ProyectoFormViewModel form)
    {
        if (!ModelState.IsValid)
            return View(form);

        await _proyectoService.CreateAsync(form);
        TempData["Success"] = $"Proyecto \"{form.Nombre}\" creado exitosamente.";
        return RedirectToAction(nameof(Index));
    }

    // ── GET /Proyectos/Edit/5 ─────────────────────────────────────────────

    public async Task<IActionResult> Edit(int id)
    {
        var proyecto = await _proyectoService.GetByIdAsync(id);
        if (proyecto is null) return NotFound();

        return View(ProyectoMapper.ToFormViewModel(proyecto));
    }

    // ── POST /Proyectos/Edit/5 ────────────────────────────────────────────

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ProyectoFormViewModel form)
    {
        if (!ModelState.IsValid)
            return View(form);

        var updated = await _proyectoService.UpdateAsync(id, form);
        if (updated is null) return NotFound();

        TempData["Success"] = $"Proyecto \"{updated.Nombre}\" actualizado.";
        return RedirectToAction(nameof(Index));
    }

    // ── POST /Proyectos/Delete/5 ──────────────────────────────────────────

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _proyectoService.DeleteAsync(id);
        if (!deleted) return NotFound();

        TempData["Success"] = "Proyecto eliminado.";
        return RedirectToAction(nameof(Index));
    }

    // ── POST /Proyectos/Toggle/5 ──────────────────────────────────────────

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Toggle(int id)
    {
        var proyecto = await _proyectoService.ToggleEstadoAsync(id);
        if (proyecto is null) return NotFound();

        TempData["Success"] = $"Estado cambiado a \"{proyecto.Estado}\".";
        return RedirectToAction(nameof(Index));
    }
}
