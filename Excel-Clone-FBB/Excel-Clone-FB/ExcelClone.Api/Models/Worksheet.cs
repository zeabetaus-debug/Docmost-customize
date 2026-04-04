namespace ExcelClone.Api.Models;

public class Worksheet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "Sheet1";

    public Guid WorkbookId { get; set; }
    public Workbook Workbook { get; set; } = null!;

    public ICollection<Cell> Cells { get; set; } = new List<Cell>();
}
