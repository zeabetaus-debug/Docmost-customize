namespace ExcelClone.Api.DTOs;

public class SaveWorkbookDto
{
    public string Name { get; set; } = null!;
    public List<WorksheetDto> Worksheets { get; set; } = new();
}
