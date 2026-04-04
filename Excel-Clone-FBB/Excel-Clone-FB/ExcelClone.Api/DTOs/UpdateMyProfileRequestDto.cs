using System.Text.Json;
using System.Text.Json.Serialization;

namespace ExcelClone.Api.DTOs;

public class UpdateMyProfileRequestDto
{
    public string? Name { get; set; }
    public string? EmployeeId { get; set; }
    public string? PhoneNumber { get; set; }

    [JsonExtensionData]
    public Dictionary<string, JsonElement>? ExtraProperties { get; set; }
}
