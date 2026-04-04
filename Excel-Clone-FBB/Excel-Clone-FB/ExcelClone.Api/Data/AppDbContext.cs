using Microsoft.EntityFrameworkCore;
using ExcelClone.Api.Models;

namespace ExcelClone.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workbook> Workbooks => Set<Workbook>();
    public DbSet<Worksheet> Worksheets => Set<Worksheet>();
    public DbSet<Cell> Cells => Set<Cell>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<WorkbookLiveShare> WorkbookLiveShares => Set<WorkbookLiveShare>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workbook>()
            .HasIndex(w => w.Name)
            .IsUnique();

        modelBuilder.Entity<Workbook>()
            .HasIndex(w => w.CreatedByUserId);

        modelBuilder.Entity<Workbook>()
            .HasIndex(w => w.CreatedByDepartment);

        modelBuilder.Entity<Workbook>()
            .HasIndex(w => w.ShareToken)
            .IsUnique();

        modelBuilder.Entity<WorkbookLiveShare>()
            .HasIndex(share => new { share.WorkbookId, share.SharedWithUserId })
            .IsUnique();

        modelBuilder.Entity<WorkbookLiveShare>()
            .HasIndex(share => share.SharedWithUserId);

        modelBuilder.Entity<AppUser>()
            .HasIndex(user => user.Email)
            .IsUnique();

        modelBuilder.Entity<AppUser>()
            .HasIndex(user => user.EmployeeId)
            .IsUnique();

        modelBuilder.Entity<AppUser>()
            .HasIndex(user => user.Department);

        modelBuilder.Entity<AppUser>()
            .HasIndex(user => user.Name);

        modelBuilder.Entity<Cell>()
            .HasAlternateKey(c => new { c.WorksheetId, c.Row, c.Column });

        modelBuilder.Entity<Cell>()
            .HasIndex(c => new { c.WorksheetId, c.Row });

        modelBuilder.Entity<WorkbookLiveShare>()
            .HasOne(share => share.Workbook)
            .WithMany(workbook => workbook.LiveShares)
            .HasForeignKey(share => share.WorkbookId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
