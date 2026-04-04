namespace ExcelClone.Api.Models;

public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = null!;
    public string EmployeeId { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string ManagerName { get; set; } = null!;
    public string Department { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string AccountStatus { get; set; } = "Active";
    public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;
}
