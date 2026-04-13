using DocArchive.API.DTOs.Documents;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController(DocumentService documentService) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDocumentRequest req)
    {
        var doc = await documentService.CreateAsync(req, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = doc.Id }, doc);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var doc = await documentService.GetByIdAsync(id);
        return doc is null ? NotFound() : Ok(doc);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDocumentRequest req)
    {
        var doc = await documentService.UpdateAsync(id, req, CurrentUserId);
        return doc is null ? NotFound() : Ok(doc);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await documentService.DeleteAsync(id, CurrentUserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] DocumentSearchRequest req)
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "User";
        var result = await documentService.SearchAsync(req, role);
        return Ok(result);
    }

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetHistory(int id)
    {
        var history = await documentService.GetHistoryAsync(id);
        return Ok(history);
    }
}
