namespace DocArchive.API.Services;

public class FilesystemFileStorageService(IConfiguration config) : IFileStorageService
{
    public string Mode => "FileSystem";
    private string BasePath => config["FileStorage:FileSystemPath"] ?? "C:\\DocArchive\\Files";

    public async Task<string?> SaveFileAsync(int fileId, Stream content, string originalFileName, string mimeType)
    {
        var now = DateTime.UtcNow;
        var dir = Path.Combine(BasePath, now.Year.ToString(), now.Month.ToString("D2"));
        Directory.CreateDirectory(dir);

        var ext = Path.GetExtension(originalFileName);
        var fileName = $"{fileId}_{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(dir, fileName);

        await using var fs = File.Create(fullPath);
        await content.CopyToAsync(fs);
        return fullPath;
    }

    public Task<(Stream stream, string mimeType, string fileName)?> GetFileAsync(int fileId, string? filePath, string originalFileName, string mimeType)
    {
        if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
            return Task.FromResult<(Stream, string, string)?>(null);

        Stream stream = File.OpenRead(filePath);
        return Task.FromResult<(Stream, string, string)?>((stream, mimeType, originalFileName));
    }

    public Task DeleteFileAsync(int fileId, string? filePath)
    {
        if (!string.IsNullOrEmpty(filePath) && File.Exists(filePath))
            File.Delete(filePath);
        return Task.CompletedTask;
    }
}
