namespace ExcelClone.Api.DTOs;

public class PatchWorkbookCellsDto
{
    public List<WorksheetDto> Worksheets { get; set; } = new();
}
