using DocArchive.API.Data;
using DocArchive.API.Entities;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/files")]
[Authorize]
public class FilesController(AppDbContext db, IFileStorageService storage, DocumentService documentService) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] int documentId, IFormFile file)
    {
        var doc = await db.Documents.FindAsync(documentId);
        if (doc is null) return NotFound("Document not found.");

        var docFile = new DocumentFile
        {
            DocumentId = documentId,
            OriginalFileName = file.FileName,
            MimeType = file.ContentType,
            FileSizeBytes = file.Length,
            StorageMode = storage.Mode,
            UploadedBy = CurrentUserId
        };
        db.DocumentFiles.Add(docFile);
        await db.SaveChangesAsync();

        await using var stream = file.OpenReadStream();
        var path = await storage.SaveFileAsync(docFile.Id, stream, file.FileName, file.ContentType);
        if (path is not null)
        {
            docFile.FilePath = path;
            await db.SaveChangesAsync();
        }

        db.DocumentHistory.Add(new DocumentHistory
        {
            DocumentId = documentId,
            ChangedBy = CurrentUserId,
            ChangeType = "FileAdded",
            FieldSnapshot = System.Text.Json.JsonSerializer.Serialize(new { FileName = file.FileName, SizeBytes = file.Length })
        });
        await db.SaveChangesAsync();

        return Ok(new { docFile.Id, docFile.OriginalFileName, docFile.FileSizeBytes, docFile.MimeType, docFile.UploadedAt });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Download(int id)
    {
        var docFile = await db.DocumentFiles.FindAsync(id);
        if (docFile is null) return NotFound();

        var result = await storage.GetFileAsync(docFile.Id, docFile.FilePath, docFile.OriginalFileName, docFile.MimeType);
        if (result is null) return NotFound("File content not found.");

        var (stream, mimeType, fileName) = result.Value;
        return File(stream, mimeType, fileName);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(int id)
    {
        var docFile = await db.DocumentFiles.FindAsync(id);
        if (docFile is null) return NotFound();

        await storage.DeleteFileAsync(docFile.Id, docFile.FilePath);
        db.DocumentFiles.Remove(docFile);

        db.DocumentHistory.Add(new DocumentHistory
        {
            DocumentId = docFile.DocumentId,
            ChangedBy = CurrentUserId,
            ChangeType = "FileDeleted",
            FieldSnapshot = System.Text.Json.JsonSerializer.Serialize(new { FileName = docFile.OriginalFileName })
        });
        await db.SaveChangesAsync();
        return NoContent();
    }
}
