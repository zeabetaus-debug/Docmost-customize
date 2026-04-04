namespace ExcelClone.Api.DTOs;

public class CellDto
{
    public int Row { get; set; }
    public int Column { get; set; }
    public string? Value { get; set; }
    public string? StyleJson { get; set; }
}
