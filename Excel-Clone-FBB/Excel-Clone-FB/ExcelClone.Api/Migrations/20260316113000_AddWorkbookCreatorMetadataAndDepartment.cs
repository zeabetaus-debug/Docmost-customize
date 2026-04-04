using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExcelClone.Api.Migrations
{
    [DbContext(typeof(Data.AppDbContext))]
    [Migration("20260316113000_AddWorkbookCreatorMetadataAndDepartment")]
    public partial class AddWorkbookCreatorMetadataAndDepartment : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Users"
                ADD COLUMN IF NOT EXISTS "Department" text NOT NULL DEFAULT '';
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Workbooks"
                ADD COLUMN IF NOT EXISTS "CreatedByUserId" uuid NULL;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Workbooks"
                ADD COLUMN IF NOT EXISTS "CreatedByName" text NULL;
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Workbooks"
                ADD COLUMN IF NOT EXISTS "CreatedByDepartment" text NULL;
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Users_Department"
                ON "Users" ("Department");
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Workbooks_CreatedByDepartment"
                ON "Workbooks" ("CreatedByDepartment");
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Workbooks_CreatedByUserId"
                ON "Workbooks" ("CreatedByUserId");
                """);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "Department" = CASE
                        WHEN "Email" = 'admin@excelclone.com' THEN 'Zea India'
                        WHEN "Email" = 'manager@excelclone.com' THEN 'Zea India'
                        WHEN "Email" = 'user@excelclone.com' THEN 'Zea India'
                        ELSE COALESCE(NULLIF("Department", ''), 'Zea India')
                    END
                WHERE "Department" IS NULL OR "Department" = '';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Workbooks_CreatedByUserId";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Workbooks_CreatedByDepartment";""");
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_Users_Department";""");

            migrationBuilder.Sql("""ALTER TABLE "Workbooks" DROP COLUMN IF EXISTS "CreatedByDepartment";""");
            migrationBuilder.Sql("""ALTER TABLE "Workbooks" DROP COLUMN IF EXISTS "CreatedByName";""");
            migrationBuilder.Sql("""ALTER TABLE "Workbooks" DROP COLUMN IF EXISTS "CreatedByUserId";""");
            migrationBuilder.Sql("""ALTER TABLE "Users" DROP COLUMN IF EXISTS "Department";""");
        }
    }
}
