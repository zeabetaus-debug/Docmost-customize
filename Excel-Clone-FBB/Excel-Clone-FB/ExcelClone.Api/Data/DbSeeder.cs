using ExcelClone.Api.Models;

namespace ExcelClone.Api.Data;

public static class DbSeeder
{
    public static async Task SeedUsersAsync(AppDbContext context)
    {
        var seededUsers = new[]
        {
            new AppUser
            {
                Name = "Aarav Mehta",
                EmployeeId = "ADM001",
                PhoneNumber = "9876543210",
                ManagerName = "Executive Board",
                Department = "Zea India",
                Email = "admin@excelclone.com",
                Password = "Admin@123",
                Role = "Role_Admin",
                AccountStatus = "Active",
                LastLoginAt = DateTime.UtcNow
            },
            new AppUser
            {
                Name = "Priya Sharma",
                EmployeeId = "MGR001",
                PhoneNumber = "9876501234",
                ManagerName = "Aarav Mehta",
                Department = "Zea India",
                Email = "manager@excelclone.com",
                Password = "Manager@123",
                Role = "Role_Manager",
                AccountStatus = "Active",
                LastLoginAt = DateTime.UtcNow
            },
            new AppUser
            {
                Name = "Rahul Verma",
                EmployeeId = "USR001",
                PhoneNumber = "9876505678",
                ManagerName = "Priya Sharma",
                Department = "Zea India",
                Email = "user@excelclone.com",
                Password = "User@123",
                Role = "Role_User",
                AccountStatus = "Active",
                LastLoginAt = DateTime.UtcNow
            }
        };

        foreach (var seededUser in seededUsers)
        {
            var existingUser = context.Users.FirstOrDefault(user => user.Email == seededUser.Email);

            if (existingUser == null)
            {
                context.Users.Add(seededUser);
                continue;
            }

            existingUser.Password = seededUser.Password;
            existingUser.Role = seededUser.Role;
            existingUser.Name = seededUser.Name;
            existingUser.EmployeeId = seededUser.EmployeeId;
            existingUser.PhoneNumber = seededUser.PhoneNumber;
            existingUser.ManagerName = seededUser.ManagerName;
            existingUser.Department = seededUser.Department;
            existingUser.AccountStatus = seededUser.AccountStatus;
        }

        await context.SaveChangesAsync();
    }
}
