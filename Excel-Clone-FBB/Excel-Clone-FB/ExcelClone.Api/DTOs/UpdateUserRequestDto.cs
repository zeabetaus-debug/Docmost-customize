namespace ExcelClone.Api.DTOs;

public class UpdateUserRequestDto
{
    public string? Name { get; set; }
    public string? EmployeeId { get; set; }
    public string? PhoneNumber { get; set; }
    public string? ManagerName { get; set; }
    public string? Department { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
}
