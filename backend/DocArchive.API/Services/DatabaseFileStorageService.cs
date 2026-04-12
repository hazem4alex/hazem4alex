using DocArchive.API.Data;
using DocArchive.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Services;

public class DatabaseFileStorageService(AppDbContext db) : IFileStorageService
{
    public string Mode => "Database";

    public async Task<string?> SaveFileAsync(int fileId, Stream content, string originalFileName, string mimeType)
    {
        using var ms = new MemoryStream();
        await content.CopyToAsync(ms);
        var fileContent = new DocumentFileContent { FileId = fileId, Content = ms.ToArray() };
        db.DocumentFileContents.Add(fileContent);
        await db.SaveChangesAsync();
        return null; // no file path for DB storage
    }

    public async Task<(Stream stream, string mimeType, string fileName)?> GetFileAsync(int fileId, string? filePath, string originalFileName, string mimeType)
    {
        var content = await db.DocumentFileContents.FirstOrDefaultAsync(c => c.FileId == fileId);
        if (content is null) return null;
        Stream stream = new MemoryStream(content.Content);
        return (stream, mimeType, originalFileName);
    }

    public async Task DeleteFileAsync(int fileId, string? filePath)
    {
        var content = await db.DocumentFileContents.FindAsync(fileId);
        if (content is not null)
        {
            db.DocumentFileContents.Remove(content);
            await db.SaveChangesAsync();
        }
    }
}
