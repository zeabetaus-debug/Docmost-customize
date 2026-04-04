namespace ExcelClone.Api.DTOs;

public class CreateUserRequestDto
{
    public string Name { get; set; } = null!;
    public string EmployeeId { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string ManagerName { get; set; } = null!;
    public string Department { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string AccountStatus { get; set; } = null!;
}
