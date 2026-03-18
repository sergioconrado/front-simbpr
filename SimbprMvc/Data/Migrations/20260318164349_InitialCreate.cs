using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SimbprMvc.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Proyectos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Usuario = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    compania = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false, defaultValue: ""),
                    Cliente = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    orden = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false, defaultValue: ""),
                    comentarios = table.Column<string>(type: "nvarchar(max)", nullable: false, defaultValue: ""),
                    Fecha = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    estado = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Activo"),
                    created_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proyectos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SimulacionBSN",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    proyecto_id = table.Column<int>(type: "int", nullable: false),
                    Etapas = table.Column<int>(type: "int", nullable: false),
                    Freq = table.Column<double>(type: "float", nullable: false),
                    Hp = table.Column<double>(type: "float", nullable: false),
                    Volt = table.Column<double>(type: "float", nullable: false),
                    Amp = table.Column<double>(type: "float", nullable: false),
                    Depth = table.Column<double>(type: "float", nullable: false),
                    tempfondo = table.Column<double>(type: "float", nullable: false, defaultValue: 90.0),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulacionBSN", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimulacionBSN_Proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimulacionIPR",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    proyecto_id = table.Column<int>(type: "int", nullable: false),
                    Pws = table.Column<double>(type: "float", nullable: false),
                    Pwf = table.Column<double>(type: "float", nullable: false),
                    Qb = table.Column<double>(type: "float", nullable: false),
                    j_index = table.Column<double>(type: "float", nullable: false),
                    Unidad = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ipr_color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "#2563eb"),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulacionIPR", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimulacionIPR_Proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SimulacionProduccion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    proyecto_id = table.Column<int>(type: "int", nullable: false),
                    Qt = table.Column<double>(type: "float", nullable: false),
                    Bsw = table.Column<double>(type: "float", nullable: false),
                    api = table.Column<double>(type: "float", nullable: false, defaultValue: 35.0),
                    Gor = table.Column<double>(type: "float", nullable: false),
                    bo = table.Column<double>(type: "float", nullable: false, defaultValue: 1.0),
                    updated_at = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SimulacionProduccion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SimulacionProduccion_Proyectos_proyecto_id",
                        column: x => x.proyecto_id,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SimulacionBSN_proyecto_id",
                table: "SimulacionBSN",
                column: "proyecto_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulacionIPR_proyecto_id",
                table: "SimulacionIPR",
                column: "proyecto_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SimulacionProduccion_proyecto_id",
                table: "SimulacionProduccion",
                column: "proyecto_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SimulacionBSN");

            migrationBuilder.DropTable(
                name: "SimulacionIPR");

            migrationBuilder.DropTable(
                name: "SimulacionProduccion");

            migrationBuilder.DropTable(
                name: "Proyectos");
        }
    }
}
