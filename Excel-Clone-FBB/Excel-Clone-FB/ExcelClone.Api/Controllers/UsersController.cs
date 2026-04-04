using System.Security.Claims;
using ExcelClone.Api.Data;
using ExcelClone.Api.DTOs;
using ExcelClone.Api.Models;
using ExcelClone.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ExcelClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<ActionResult<MyProfileDto>> GetMyProfile()
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(existingUser => existingUser.Id == accessContext.UserId);

        if (user == null)
        {
            return NotFound("User not found.");
        }

        return Ok(MapMyProfile(user));
    }

    [HttpPatch("me")]
    public async Task<ActionResult<MyProfileDto>> UpdateMyProfile(UpdateMyProfileRequestDto dto)
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        if (dto.ExtraProperties?.Count > 0)
        {
            return BadRequest("Only name, employee ID, and phone number can be updated in My Profile.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(existingUser => existingUser.Id == accessContext.UserId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        var hasChanges = false;

        if (dto.Name != null)
        {
            var normalizedName = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(normalizedName))
            {
                return BadRequest("Name is required.");
            }

            user.Name = normalizedName;
            hasChanges = true;
        }

        if (dto.PhoneNumber != null)
        {
            var normalizedPhoneNumber = dto.PhoneNumber.Trim();
            if (!IsValidPhoneNumber(normalizedPhoneNumber))
            {
                return BadRequest("Invalid phone number.");
            }

            user.PhoneNumber = normalizedPhoneNumber;
            hasChanges = true;
        }

        if (dto.EmployeeId != null)
        {
            var normalizedEmployeeId = dto.EmployeeId.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmployeeId))
            {
                return BadRequest("Employee ID is required.");
            }

            if (await _context.Users.AnyAsync(existingUser => existingUser.Id != user.Id && existingUser.EmployeeId == normalizedEmployeeId))
            {
                return BadRequest("Employee ID already exists.");
            }

            user.EmployeeId = normalizedEmployeeId;
            hasChanges = true;
        }

        if (!hasChanges)
        {
            return BadRequest("No profile changes were provided.");
        }

        await _context.SaveChangesAsync();
        return Ok(MapMyProfile(user));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserListItemDto>>> GetUsers()
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        var users = await _context.Users
            .AsNoTracking()
            .OrderBy(user => user.Name)
            .ToListAsync();

        return Ok(users.Select(user => new UserListItemDto
        {
            Id = user.Id,
            Name = user.Name,
            EmployeeId = user.EmployeeId,
            ManagerName = user.ManagerName,
            Department = user.Department,
            Role = RoleHelper.ToDisplayRole(user.Role),
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AccountStatus = user.AccountStatus,
            CanManageStatus = CanManageStatus(accessContext, user),
            CanDeleteUser = CanDeleteUser(accessContext, user),
            CanUpdateUser = CanUpdateUser(accessContext, user)
        }));
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Role_Admin,Role_Manager")]
    public async Task<IActionResult> UpdateUserStatus(Guid id, UpdateUserStatusRequestDto dto)
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        var accountStatus = dto.AccountStatus?.Trim() switch
        {
            "Active" => "Active",
            "Inactive" => "Inactive",
            _ => string.Empty
        };

        if (string.IsNullOrEmpty(accountStatus))
        {
            return BadRequest("Invalid account status.");
        }

        var user = await _context.Users.FirstOrDefaultAsync(existingUser => existingUser.Id == id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (!CanManageStatus(accessContext, user))
        {
            return Forbid();
        }

        user.AccountStatus = accountStatus;
        await _context.SaveChangesAsync();

        return Ok(MapUserListItem(accessContext, user));
    }

    [HttpPatch("{id:guid}")]
    [Authorize(Roles = "Role_Admin,Role_Manager,Role_User")]
    public async Task<ActionResult<UserListItemDto>> UpdateUser(Guid id, UpdateUserRequestDto dto)
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        var user = await _context.Users.FirstOrDefaultAsync(existingUser => existingUser.Id == id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (!CanUpdateUser(accessContext, user))
        {
            return Forbid();
        }

        if (user.Id == accessContext.UserId)
        {
            if (dto.Email != null || dto.Role != null || dto.Department != null || dto.Password != null || dto.ManagerName != null)
            {
                return BadRequest("Only name, employee ID, and phone number can be updated on your own profile.");
            }
        }

        var targetRole = user.Role;
        if (accessContext.Role == "Role_Admin" && dto.Role != null)
        {
            var normalizedRole = RoleHelper.ToStoredRole(dto.Role);
            if (string.IsNullOrEmpty(normalizedRole))
            {
                return BadRequest("Invalid role.");
            }

            targetRole = normalizedRole;
        }

        var targetDepartment = user.Department;
        if ((accessContext.Role == "Role_Admin" || accessContext.Role == "Role_Manager") && dto.Department != null)
        {
            var normalizedDepartment = NormalizeDepartment(dto.Department);
            if (string.IsNullOrEmpty(normalizedDepartment))
            {
                return BadRequest("Invalid department.");
            }

            targetDepartment = normalizedDepartment;
        }

        if (dto.Name != null)
        {
            if (accessContext.Role is not ("Role_Admin" or "Role_Manager" or "Role_User"))
            {
                return Forbid();
            }

            var normalizedName = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(normalizedName))
            {
                return BadRequest("Name is required.");
            }

            user.Name = normalizedName;
        }

        if (dto.PhoneNumber != null)
        {
            if (accessContext.Role is not ("Role_Admin" or "Role_Manager" or "Role_User"))
            {
                return Forbid();
            }

            var normalizedPhoneNumber = dto.PhoneNumber.Trim();
            if (!IsValidPhoneNumber(normalizedPhoneNumber))
            {
                return BadRequest("Invalid phone number.");
            }

            user.PhoneNumber = normalizedPhoneNumber;
        }

        if (dto.Email != null)
        {
            if (accessContext.Role is not ("Role_Admin" or "Role_Manager"))
            {
                return Forbid();
            }

            var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(normalizedEmail))
            {
                return BadRequest("Email is required.");
            }

            if (await _context.Users.AnyAsync(existingUser => existingUser.Id != id && existingUser.Email == normalizedEmail))
            {
                return BadRequest("Email already exists.");
            }

            user.Email = normalizedEmail;
        }

        if (dto.EmployeeId != null)
        {
            if (user.Id != accessContext.UserId && accessContext.Role is not ("Role_Admin" or "Role_Manager"))
            {
                return Forbid();
            }

            var normalizedEmployeeId = dto.EmployeeId.Trim();
            if (string.IsNullOrWhiteSpace(normalizedEmployeeId))
            {
                return BadRequest("Employee ID is required.");
            }

            if (await _context.Users.AnyAsync(existingUser => existingUser.Id != id && existingUser.EmployeeId == normalizedEmployeeId))
            {
                return BadRequest("Employee ID already exists.");
            }

            user.EmployeeId = normalizedEmployeeId;
        }

        if (dto.Password != null)
        {
            if (accessContext.Role is not ("Role_Admin" or "Role_Manager"))
            {
                return Forbid();
            }

            var normalizedPassword = dto.Password.Trim();
            if (string.IsNullOrWhiteSpace(normalizedPassword))
            {
                return BadRequest("Password cannot be empty.");
            }

            user.Password = normalizedPassword;
        }

        if (dto.Department != null)
        {
            if (accessContext.Role is not ("Role_Admin" or "Role_Manager"))
            {
                return Forbid();
            }

            user.Department = targetDepartment;
        }

        if (dto.Role != null)
        {
            if (accessContext.Role != "Role_Admin")
            {
                return Forbid();
            }

            user.Role = targetRole;
        }

        if (dto.ManagerName != null)
        {
            if (accessContext.Role != "Role_Admin")
            {
                return Forbid();
            }

            if (targetRole != "Role_User")
            {
                return BadRequest("Manager Name can only be updated for users.");
            }

            var normalizedManagerName = dto.ManagerName.Trim();
            if (string.IsNullOrWhiteSpace(normalizedManagerName))
            {
                return BadRequest("Manager Name is required for users.");
            }

            user.ManagerName = normalizedManagerName;
        }
        else if (accessContext.Role == "Role_Admin" && targetRole != "Role_User")
        {
            user.ManagerName = string.Empty;
        }

        if (targetRole == "Role_User" && string.IsNullOrWhiteSpace(user.ManagerName))
        {
            return BadRequest("Manager Name is required for users.");
        }

        await _context.SaveChangesAsync();
        return Ok(MapUserListItem(accessContext, user));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Role_Admin,Role_Manager")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var accessContext = GetAccessContext();
        if (accessContext == null)
        {
            return Forbid();
        }

        var user = await _context.Users.FirstOrDefaultAsync(existingUser => existingUser.Id == id);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        if (!CanDeleteUser(accessContext, user))
        {
            return Forbid();
        }

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Role_Admin,Role_Manager")]
    public async Task<IActionResult> CreateUser(CreateUserRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) ||
            string.IsNullOrWhiteSpace(dto.EmployeeId) ||
            string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
            string.IsNullOrWhiteSpace(dto.ManagerName) ||
            string.IsNullOrWhiteSpace(dto.Department) ||
            string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role) ||
            string.IsNullOrWhiteSpace(dto.AccountStatus))
        {
            return BadRequest("All fields are required.");
        }

        var creatorRole = User.FindFirstValue(ClaimTypes.Role);
        if (string.IsNullOrWhiteSpace(creatorRole))
        {
            return Forbid();
        }

        var targetRole = RoleHelper.ToStoredRole(dto.Role);
        if (string.IsNullOrEmpty(targetRole))
        {
            return BadRequest("Invalid role.");
        }

        if (!RoleHelper.CanCreateRole(creatorRole, targetRole))
        {
            return Forbid();
        }

        var accountStatus = dto.AccountStatus.Trim() switch
        {
            "Active" => "Active",
            "Inactive" => "Inactive",
            _ => string.Empty
        };

        if (string.IsNullOrEmpty(accountStatus))
        {
            return BadRequest("Invalid account status.");
        }

        var department = dto.Department.Trim() switch
        {
            "Zea Us" => "Zea Us",
            "Zea India" => "Zea India",
            "Zea Lead-Gen" => "Zea Lead-Gen",
            "Admin" => "Admin",
            _ => string.Empty
        };

        if (string.IsNullOrEmpty(department))
        {
            return BadRequest("Invalid department.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var employeeId = dto.EmployeeId.Trim();

        if (await _context.Users.AnyAsync(user => user.Email == normalizedEmail))
        {
            return BadRequest("Email already exists.");
        }

        if (await _context.Users.AnyAsync(user => user.EmployeeId == employeeId))
        {
            return BadRequest("Employee ID already exists.");
        }

        var user = new AppUser
        {
            Name = dto.Name.Trim(),
            EmployeeId = employeeId,
            PhoneNumber = dto.PhoneNumber.Trim(),
            ManagerName = dto.ManagerName.Trim(),
            Department = department,
            Email = normalizedEmail,
            Password = dto.Password,
            Role = targetRole,
            AccountStatus = accountStatus,
            LastLoginAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Name,
            user.EmployeeId,
            user.Email,
            user.Department,
            Role = RoleHelper.ToDisplayRole(user.Role),
            user.AccountStatus
        });
    }

    private AccessContext? GetAccessContext()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var role = User.FindFirstValue(ClaimTypes.Role);
        var department = User.FindFirstValue("department");

        if (!Guid.TryParse(userIdValue, out var userId) || string.IsNullOrWhiteSpace(role))
        {
            return null;
        }

        return new AccessContext(userId, role, department ?? string.Empty);
    }

    private static bool CanManageStatus(AccessContext accessContext, AppUser user) =>
        user.Role != "Role_Admin" &&
        (accessContext.Role == "Role_Admin" ||
         (accessContext.Role == "Role_Manager" &&
          user.Role == "Role_User" &&
          string.Equals(user.Department, accessContext.Department, StringComparison.OrdinalIgnoreCase)));

    private static bool CanDeleteUser(AccessContext accessContext, AppUser user) =>
        user.Role != "Role_Admin" &&
        (accessContext.Role == "Role_Admin" ||
         (accessContext.Role == "Role_Manager" &&
          user.Role == "Role_User" &&
          string.Equals(user.Department, accessContext.Department, StringComparison.OrdinalIgnoreCase)));

    private static bool CanUpdateUser(AccessContext accessContext, AppUser user) =>
        accessContext.Role switch
        {
            "Role_Admin" => user.Role is "Role_Manager" or "Role_User",
            "Role_Manager" => user.Role == "Role_User" &&
                              string.Equals(user.Department, accessContext.Department, StringComparison.OrdinalIgnoreCase),
            "Role_User" => user.Id == accessContext.UserId,
            _ => false
        };

    private static string NormalizeDepartment(string department) => department.Trim() switch
    {
        "Zea Us" => "Zea Us",
        "Zea India" => "Zea India",
        "Zea Lead-Gen" => "Zea Lead-Gen",
        "Admin" => "Admin",
        _ => string.Empty
    };

    private static bool IsValidPhoneNumber(string phoneNumber) =>
        !string.IsNullOrWhiteSpace(phoneNumber) &&
        Regex.IsMatch(phoneNumber, @"^\+?[0-9()\-\s]{7,20}$");

    private static MyProfileDto MapMyProfile(AppUser user) =>
        new()
        {
            Id = user.Id,
            Name = user.Name,
            EmployeeId = user.EmployeeId,
            PhoneNumber = user.PhoneNumber,
            ManagerName = user.ManagerName,
            Department = user.Department,
            Role = RoleHelper.ToDisplayRole(user.Role),
            Email = user.Email,
            AccountStatus = user.AccountStatus
        };

    private static UserListItemDto MapUserListItem(AccessContext accessContext, AppUser user) =>
        new()
        {
            Id = user.Id,
            Name = user.Name,
            EmployeeId = user.EmployeeId,
            ManagerName = user.ManagerName,
            Department = user.Department,
            Role = RoleHelper.ToDisplayRole(user.Role),
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AccountStatus = user.AccountStatus,
            CanManageStatus = CanManageStatus(accessContext, user),
            CanDeleteUser = CanDeleteUser(accessContext, user),
            CanUpdateUser = CanUpdateUser(accessContext, user)
        };

    private sealed record AccessContext(Guid UserId, string Role, string Department);
}
