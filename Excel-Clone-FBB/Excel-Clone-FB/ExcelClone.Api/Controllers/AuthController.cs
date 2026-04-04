using ExcelClone.Api.Data;
using ExcelClone.Api.DTOs;
using ExcelClone.Api.Models;
using ExcelClone.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExcelClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtTokenService _jwtTokenService;

    public AuthController(AppDbContext context, JwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) ||
            string.IsNullOrWhiteSpace(dto.Password) ||
            string.IsNullOrWhiteSpace(dto.Role))
        {
            return BadRequest("Email, password, and role are required.");
        }

        var storedRole = RoleHelper.ToStoredRole(dto.Role);

        if (string.IsNullOrEmpty(storedRole))
        {
            return BadRequest("Invalid role.");
        }

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(existingUser =>
            existingUser.Email == normalizedEmail &&
            existingUser.Password == dto.Password &&
            existingUser.Role == storedRole);

        if (user == null)
        {
            return Unauthorized("Invalid email, password, or role.");
        }

        if (user.AccountStatus != "Active")
        {
            return Unauthorized("This account is inactive.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        var token = _jwtTokenService.CreateToken(user);

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Department,
            Role = RoleHelper.ToDisplayRole(user.Role),
            token
        });
    }
}
