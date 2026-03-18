using Microsoft.AspNetCore.Mvc;
using SimbprMvc.Models.ViewModels;
using SimbprMvc.Services.Interfaces;

namespace SimbprMvc.Controllers;

/// <summary>
/// Simulator dashboard controller.
/// GET  /Simulacion/{proyectoId}          — Dashboard for a project
/// GET  /Simulacion/{proyectoId}/IPR      — IPR tab
/// POST /Simulacion/{proyectoId}/IPR      — Calculate + save IPR
/// GET  /Simulacion/{proyectoId}/Produccion
/// POST /Simulacion/{proyectoId}/Produccion
/// GET  /Simulacion/{proyectoId}/BSN
/// POST /Simulacion/{proyectoId}/BSN
/// </summary>
public class SimulacionController : Controller
{
    private readonly IProyectoService        _proyectoService;
    private readonly ISimulacionService      _simulacionService;
    private readonly IIPRCalculationService  _iprCalc;
    private readonly IProduccionCalculationService _prodCalc;
    private readonly IBSNCalculationService  _bsnCalc;

    public SimulacionController(
        IProyectoService        proyectoService,
        ISimulacionService      simulacionService,
        IIPRCalculationService  iprCalc,
        IProduccionCalculationService prodCalc,
        IBSNCalculationService  bsnCalc)
    {
        _proyectoService   = proyectoService;
        _simulacionService = simulacionService;
        _iprCalc           = iprCalc;
        _prodCalc          = prodCalc;
        _bsnCalc           = bsnCalc;
    }

    // ── Dashboard ─────────────────────────────────────────────────────────

    public async Task<IActionResult> Index(int proyectoId)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var iprData  = await _simulacionService.GetIPRAsync(proyectoId);
        var prodData = await _simulacionService.GetProduccionAsync(proyectoId);
        var bsnData  = await _simulacionService.GetBSNAsync(proyectoId);

        var vm = new SimuladorViewModel
        {
            ProyectoId     = proyecto.Id,
            ProyectoNombre = proyecto.Nombre,
            ProyectoCliente = proyecto.Cliente,
            ProyectoEstado = proyecto.Estado,

            IPR = MapToIPRViewModel(proyectoId, iprData),
            Produccion = MapToProduccionViewModel(proyectoId, prodData),
            BSN = MapToBSNViewModel(proyectoId, bsnData),
        };

        // Pre-compute results so the dashboard shows them immediately
        vm.IPR.Resultado  = _iprCalc.Calculate(vm.IPR.Pws, vm.IPR.Pwf, vm.IPR.Qb, vm.IPR.JIndex, vm.IPR.Unidad);
        vm.Produccion.Resultado = _prodCalc.Calculate(vm.Produccion.Qt, vm.Produccion.Bsw, vm.Produccion.Api, vm.Produccion.Gor, vm.Produccion.Bo);
        vm.BSN.Resultado  = _bsnCalc.Calculate(vm.BSN.Etapas, vm.BSN.Freq, vm.BSN.Hp, vm.BSN.Volt, vm.BSN.Amp);

        return View(vm);
    }

    // ── IPR ───────────────────────────────────────────────────────────────

    public async Task<IActionResult> IPR(int proyectoId)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var data = await _simulacionService.GetIPRAsync(proyectoId);
        var vm   = MapToIPRViewModel(proyectoId, data);
        vm.ProyectoNombre = proyecto.Nombre;

        vm.Resultado = _iprCalc.Calculate(vm.Pws, vm.Pwf, vm.Qb, vm.JIndex, vm.Unidad);
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> IPR(int proyectoId, SimulacionIPRViewModel vm)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        vm.ProyectoNombre = proyecto.Nombre;

        if (!ModelState.IsValid)
        {
            vm.Resultado = _iprCalc.Calculate(vm.Pws, vm.Pwf, vm.Qb, vm.JIndex, vm.Unidad);
            return View(vm);
        }

        await _simulacionService.UpsertIPRAsync(proyectoId, vm);
        vm.Resultado = _iprCalc.Calculate(vm.Pws, vm.Pwf, vm.Qb, vm.JIndex, vm.Unidad);

        TempData["Success"] = "Datos IPR guardados.";
        return View(vm);
    }

    // ── Produccion ────────────────────────────────────────────────────────

    public async Task<IActionResult> Produccion(int proyectoId)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var data = await _simulacionService.GetProduccionAsync(proyectoId);
        var vm   = MapToProduccionViewModel(proyectoId, data);
        vm.ProyectoNombre = proyecto.Nombre;

        vm.Resultado = _prodCalc.Calculate(vm.Qt, vm.Bsw, vm.Api, vm.Gor, vm.Bo);
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Produccion(int proyectoId, SimulacionProduccionViewModel vm)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        vm.ProyectoNombre = proyecto.Nombre;

        if (!ModelState.IsValid)
        {
            vm.Resultado = _prodCalc.Calculate(vm.Qt, vm.Bsw, vm.Api, vm.Gor, vm.Bo);
            return View(vm);
        }

        await _simulacionService.UpsertProduccionAsync(proyectoId, vm);
        vm.Resultado = _prodCalc.Calculate(vm.Qt, vm.Bsw, vm.Api, vm.Gor, vm.Bo);

        TempData["Success"] = "Datos de producción guardados.";
        return View(vm);
    }

    // ── BSN ───────────────────────────────────────────────────────────────

    public async Task<IActionResult> BSN(int proyectoId)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        var data = await _simulacionService.GetBSNAsync(proyectoId);
        var vm   = MapToBSNViewModel(proyectoId, data);
        vm.ProyectoNombre = proyecto.Nombre;

        vm.Resultado = _bsnCalc.Calculate(vm.Etapas, vm.Freq, vm.Hp, vm.Volt, vm.Amp);
        return View(vm);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BSN(int proyectoId, SimulacionBSNViewModel vm)
    {
        var proyecto = await _proyectoService.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();

        vm.ProyectoNombre = proyecto.Nombre;

        if (!ModelState.IsValid)
        {
            vm.Resultado = _bsnCalc.Calculate(vm.Etapas, vm.Freq, vm.Hp, vm.Volt, vm.Amp);
            return View(vm);
        }

        await _simulacionService.UpsertBSNAsync(proyectoId, vm);
        vm.Resultado = _bsnCalc.Calculate(vm.Etapas, vm.Freq, vm.Hp, vm.Volt, vm.Amp);

        TempData["Success"] = "Datos BSN guardados.";
        return View(vm);
    }

    // ── Mapping helpers ───────────────────────────────────────────────────

    private static SimulacionIPRViewModel MapToIPRViewModel(int proyectoId, Models.Domain.SimulacionIPR? data)
        => new()
        {
            ProyectoId = proyectoId,
            Pws        = data?.Pws       ?? 0,
            Pwf        = data?.Pwf       ?? 0,
            Qb         = data?.Qb        ?? 0,
            JIndex     = data?.JIndex    ?? 1.0,
            Unidad     = data?.Unidad    ?? "kg",
            IprColor   = data?.IprColor  ?? "#2563eb",
        };

    private static SimulacionProduccionViewModel MapToProduccionViewModel(int proyectoId, Models.Domain.SimulacionProduccion? data)
        => new()
        {
            ProyectoId = proyectoId,
            Qt         = data?.Qt  ?? 0,
            Bsw        = data?.Bsw ?? 0,
            Api        = data?.Api ?? 35.0,
            Gor        = data?.Gor ?? 0,
            Bo         = data?.Bo  ?? 1.0,
        };

    private static SimulacionBSNViewModel MapToBSNViewModel(int proyectoId, Models.Domain.SimulacionBSN? data)
        => new()
        {
            ProyectoId = proyectoId,
            Etapas     = data?.Etapas    ?? 120,
            Freq       = data?.Freq      ?? 60.0,
            Hp         = data?.Hp        ?? 200.0,
            Volt       = data?.Volt      ?? 1150.0,
            Amp        = data?.Amp       ?? 92.0,
            Depth      = data?.Depth     ?? 2200.0,
            TempFondo  = data?.TempFondo ?? 90.0,
        };
}
