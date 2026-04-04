namespace ExcelClone.Api.Models;

public class WorkbookLiveShare
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkbookId { get; set; }
    public Workbook Workbook { get; set; } = null!;
    public Guid SharedWithUserId { get; set; }
    public string SharedWithName { get; set; } = null!;
    public string SharedWithDepartment { get; set; } = null!;
    public Guid SharedByUserId { get; set; }
    public string SharedByName { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
