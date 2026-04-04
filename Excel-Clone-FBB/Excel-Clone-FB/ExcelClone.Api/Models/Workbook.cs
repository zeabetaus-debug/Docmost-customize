namespace ExcelClone.Api.Models;

public class Workbook
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public Guid? CreatedByUserId { get; set; }
    public string? CreatedByName { get; set; }
    public string? CreatedByDepartment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? ShareToken { get; set; }
    public ICollection<Worksheet> Worksheets { get; set; } = new List<Worksheet>();
    public ICollection<WorkbookLiveShare> LiveShares { get; set; } = new List<WorkbookLiveShare>();
}
