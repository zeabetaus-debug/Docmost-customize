namespace ExcelClone.Api.Models;

public class Cell
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorksheetId { get; set; }
    public Worksheet Worksheet { get; set; } = null!;

    public int Row { get; set; }
    public int Column { get; set; }

    public string? Value { get; set; }
    public string? StyleJson { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
