namespace ExcelClone.Api.DTOs;

public class WorksheetDto
{
    public string Name { get; set; } = null!;
    public List<CellDto> Cells { get; set; } = new();
}
