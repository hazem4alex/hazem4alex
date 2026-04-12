namespace DocArchive.API.Entities;

public class Document
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Active"; // Active | Archived | Deleted
    public DateTime EntryDatetime { get; set; } = DateTime.UtcNow;
    public int AddedBy { get; set; }
    public DateTime LastModified { get; set; } = DateTime.UtcNow;
    public int LastModifiedBy { get; set; }

    public Category Category { get; set; } = null!;
    public User AddedByUser { get; set; } = null!;
    public User LastModifiedByUser { get; set; } = null!;
    public ICollection<DocumentFieldValue> FieldValues { get; set; } = new List<DocumentFieldValue>();
    public ICollection<DocumentFile> Files { get; set; } = new List<DocumentFile>();
    public ICollection<DocumentHistory> History { get; set; } = new List<DocumentHistory>();
}
