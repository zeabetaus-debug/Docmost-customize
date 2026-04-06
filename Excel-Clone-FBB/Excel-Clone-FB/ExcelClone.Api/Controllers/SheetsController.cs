using ExcelClone.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;

namespace ExcelClone.Api.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/sheets")]
public class SheetsController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public SheetsController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    [HttpPost("save")]
    public async Task<IActionResult> Save([FromBody] SaveSheetRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return BadRequest(new
            {
                success = false,
                message = "Sheet content is required."
            });
        }

        var nestBaseUrl = _configuration["DocmostApi:BaseUrl"] ?? "http://localhost:3000";
        var httpClient = _httpClientFactory.CreateClient();

        var payload = new DocmostCreatePageRequestDto
        {
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Sheet Auto Saved" : dto.Title,
            Content = dto.Content?.ToString() ?? string.Empty,
            CreatedBy = dto.CreatedBy,
        };

        var response = await httpClient.PostAsJsonAsync($"{nestBaseUrl}/api/zeaatlas/pages", payload);
        var responseBody = await response.Content.ReadAsStringAsync();

        object? page = null;
        try
        {
            if (!string.IsNullOrWhiteSpace(responseBody))
            {
                using var jsonDoc = System.Text.Json.JsonDocument.Parse(responseBody);
                var root = jsonDoc.RootElement;

                if (root.ValueKind == System.Text.Json.JsonValueKind.Object &&
                    root.TryGetProperty("data", out var nestedData))
                {
                    page = System.Text.Json.JsonSerializer.Deserialize<object>(nestedData.GetRawText());
                }
                else
                {
                    page = System.Text.Json.JsonSerializer.Deserialize<object>(responseBody);
                }
            }
        }
        catch
        {
            page = null;
        }

        if (response.IsSuccessStatusCode)
        {
            return Ok(new
            {
                success = true,
                message = "Saved successfully",
                data = responseBody,
                docmostPage = page,
            });
        }

        return BadRequest(new
        {
            success = false,
            message = string.IsNullOrWhiteSpace(responseBody) ? "Docmost sync failed" : responseBody,
        });
    }
}
