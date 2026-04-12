namespace DocArchive.API.Entities;

public class DocumentFieldValue
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int FieldId { get; set; }
    public string? FieldValue { get; set; }

    public Document Document { get; set; } = null!;
    public CategoryField Field { get; set; } = null!;
}
