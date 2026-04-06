namespace ExcelClone.Api.DTOs;

public class SaveSheetRequestDto
{
    public string Title { get; set; } = "Sheet Auto Saved";
    public string Content { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
}

public class DocmostCreatePageRequestDto
{
    public string Title { get; set; } = "Sheet Auto Saved";
    public string Content { get; set; } = string.Empty;
    public string? CreatedBy { get; set; }
}
