namespace DocArchive.API.Services;

public interface IFileStorageService
{
    Task<string?> SaveFileAsync(int fileId, Stream content, string originalFileName, string mimeType);
    Task<(Stream stream, string mimeType, string fileName)?> GetFileAsync(int fileId, string? filePath, string originalFileName, string mimeType);
    Task DeleteFileAsync(int fileId, string? filePath);
    string Mode { get; }
}
