using Microsoft.EntityFrameworkCore;
using SimbprMvc.Models.Domain;

namespace SimbprMvc.Data;

/// <summary>
/// Entity Framework Core DbContext for the SIMBPR application.
/// Manages the connection to SQL Server and all domain entities.
/// </summary>
public class SimbprDbContext : DbContext
{
    public SimbprDbContext(DbContextOptions<SimbprDbContext> options) : base(options) { }

    public DbSet<Proyecto> Proyectos => Set<Proyecto>();
    public DbSet<SimulacionIPR> SimulacionesIPR => Set<SimulacionIPR>();
    public DbSet<SimulacionProduccion> SimulacionesProduccion => Set<SimulacionProduccion>();
    public DbSet<SimulacionBSN> SimulacionesBSN => Set<SimulacionBSN>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Proyecto ──────────────────────────────────────────────────────
        modelBuilder.Entity<Proyecto>(entity =>
        {
            entity.ToTable("Proyectos");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.CreatedAt)
                .HasColumnName("created_at")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.Property(e => e.Compania).HasColumnName("compania").HasDefaultValue(string.Empty);
            entity.Property(e => e.Orden).HasColumnName("orden").HasDefaultValue(string.Empty);
            entity.Property(e => e.Comentarios).HasColumnName("comentarios").HasDefaultValue(string.Empty);
            entity.Property(e => e.Estado).HasColumnName("estado").HasDefaultValue("Activo");
        });

        // ── SimulacionIPR ─────────────────────────────────────────────────
        modelBuilder.Entity<SimulacionIPR>(entity =>
        {
            entity.ToTable("SimulacionIPR");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ProyectoId).HasColumnName("proyecto_id");
            entity.Property(e => e.JIndex).HasColumnName("j_index");
            entity.Property(e => e.IprColor).HasColumnName("ipr_color").HasDefaultValue("#2563eb");
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.Proyecto)
                .WithOne(p => p.SimulacionIPR)
                .HasForeignKey<SimulacionIPR>(e => e.ProyectoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── SimulacionProduccion ──────────────────────────────────────────
        modelBuilder.Entity<SimulacionProduccion>(entity =>
        {
            entity.ToTable("SimulacionProduccion");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ProyectoId).HasColumnName("proyecto_id");
            entity.Property(e => e.Api).HasColumnName("api").HasDefaultValue(35.0);
            entity.Property(e => e.Bo).HasColumnName("bo").HasDefaultValue(1.0);
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.Proyecto)
                .WithOne(p => p.SimulacionProduccion)
                .HasForeignKey<SimulacionProduccion>(e => e.ProyectoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── SimulacionBSN ─────────────────────────────────────────────────
        modelBuilder.Entity<SimulacionBSN>(entity =>
        {
            entity.ToTable("SimulacionBSN");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.ProyectoId).HasColumnName("proyecto_id");
            entity.Property(e => e.TempFondo).HasColumnName("tempfondo").HasDefaultValue(90.0);
            entity.Property(e => e.UpdatedAt)
                .HasColumnName("updated_at")
                .HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(e => e.Proyecto)
                .WithOne(p => p.SimulacionBSN)
                .HasForeignKey<SimulacionBSN>(e => e.ProyectoId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
