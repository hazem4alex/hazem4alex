namespace DocArchive.API.Entities;

public class DocumentFile
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string StorageMode { get; set; } = "FileSystem"; // Database | FileSystem
    public string? FilePath { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public int UploadedBy { get; set; }

    public Document Document { get; set; } = null!;
    public User UploadedByUser { get; set; } = null!;
    public DocumentFileContent? Content { get; set; }
}
