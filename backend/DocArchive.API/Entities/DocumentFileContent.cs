namespace DocArchive.API.Entities;

public class DocumentFileContent
{
    public int FileId { get; set; }
    public byte[] Content { get; set; } = Array.Empty<byte>();

    public DocumentFile File { get; set; } = null!;
}
