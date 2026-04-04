using System;
using ExcelClone.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExcelClone.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260316153000_AddWorkbookLiveShares")]
    public partial class AddWorkbookLiveShares : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkbookLiveShares",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkbookId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedWithUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedWithName = table.Column<string>(type: "text", nullable: false),
                    SharedWithDepartment = table.Column<string>(type: "text", nullable: false),
                    SharedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SharedByName = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkbookLiveShares", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkbookLiveShares_Workbooks_WorkbookId",
                        column: x => x.WorkbookId,
                        principalTable: "Workbooks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkbookLiveShares_SharedWithUserId",
                table: "WorkbookLiveShares",
                column: "SharedWithUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkbookLiveShares_WorkbookId_SharedWithUserId",
                table: "WorkbookLiveShares",
                columns: new[] { "WorkbookId", "SharedWithUserId" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkbookLiveShares");
        }
    }
}
