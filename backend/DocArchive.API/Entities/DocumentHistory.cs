namespace DocArchive.API.Entities;

public class DocumentHistory
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public string ChangeType { get; set; } = "Updated"; // Created | Updated | FileAdded | FileDeleted | StatusChanged
    public string? FieldSnapshot { get; set; } // JSON snapshot

    public Document Document { get; set; } = null!;
    public User ChangedByUser { get; set; } = null!;
}
