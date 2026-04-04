using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExcelClone.Api.Migrations
{
    [DbContext(typeof(Data.AppDbContext))]
    [Migration("20260316093000_AddUserProfileFields")]
    public partial class AddUserProfileFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountStatus",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "Active");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ManagerName",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "Name" = CASE
                        WHEN "Email" = 'admin@excelclone.com' THEN 'Aarav Mehta'
                        WHEN "Email" = 'manager@excelclone.com' THEN 'Priya Sharma'
                        WHEN "Email" = 'user@excelclone.com' THEN 'Rahul Verma'
                        ELSE "Name"
                    END,
                    "EmployeeId" = CASE
                        WHEN "Email" = 'admin@excelclone.com' THEN 'ADM001'
                        WHEN "Email" = 'manager@excelclone.com' THEN 'MGR001'
                        WHEN "Email" = 'user@excelclone.com' THEN 'USR001'
                        ELSE 'EMP-' || substring(md5("Id"::text), 1, 8)
                    END,
                    "PhoneNumber" = CASE
                        WHEN "Email" = 'admin@excelclone.com' THEN '9876543210'
                        WHEN "Email" = 'manager@excelclone.com' THEN '9876501234'
                        WHEN "Email" = 'user@excelclone.com' THEN '9876505678'
                        ELSE "PhoneNumber"
                    END,
                    "ManagerName" = CASE
                        WHEN "Email" = 'admin@excelclone.com' THEN 'Executive Board'
                        WHEN "Email" = 'manager@excelclone.com' THEN 'Aarav Mehta'
                        WHEN "Email" = 'user@excelclone.com' THEN 'Priya Sharma'
                        ELSE "ManagerName"
                    END,
                    "AccountStatus" = 'Active'
                WHERE "EmployeeId" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_EmployeeId",
                table: "Users",
                column: "EmployeeId",
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_EmployeeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AccountStatus",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ManagerName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Users");
        }
    }
}
