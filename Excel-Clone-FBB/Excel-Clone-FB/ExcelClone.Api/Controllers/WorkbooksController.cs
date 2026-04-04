using ExcelClone.Api.Data;
using ExcelClone.Api.DTOs;
using ExcelClone.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ExcelClone.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/[controller]")]
public class WorkbooksController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkbooksController(AppDbContext context)
    {
        _context = context;
    }

    // ✅ SAVE NEW FILE
    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> SaveAs([FromBody] SaveWorkbookDto dto)
    {
        var workbook = new Workbook
        {
            Name = dto.Name,
            CreatedAt = DateTime.UtcNow,
            Worksheets = dto.Worksheets.Select(ws => new Worksheet
            {
                Name = ws.Name,
                Cells = ws.Cells.Select(cell => new Cell
                {
                    Row = cell.Row,
                    Column = cell.Column,
                    Value = cell.Value,
                    StyleJson = cell.StyleJson,
                    UpdatedAt = DateTime.UtcNow
                }).ToList()
            }).ToList()
        };

        _context.Workbooks.Add(workbook);
        await _context.SaveChangesAsync();

        return Ok(workbook.Id);
    }

    // ✅ GET ALL FILES (FOR SIDEBAR)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.Workbooks
            .Select(w => new
            {
                w.Id,
                w.Name
            })
            .ToListAsync();

        return Ok(list);
    }

    // ✅ GET SINGLE FILE
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Get(Guid id)
    {
        var workbook = await _context.Workbooks
            .Include(w => w.Worksheets)
            .ThenInclude(ws => ws.Cells)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (workbook == null)
            return NotFound();

        return Ok(workbook);
    }

    // ✅ DELETE FILE (OPTIONAL)
    [HttpDelete("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> Delete(Guid id)
    {
        var workbook = await _context.Workbooks.FindAsync(id);

        if (workbook == null)
            return NotFound();

        _context.Workbooks.Remove(workbook);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
