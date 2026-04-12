namespace DocArchive.API.Entities;

public class CategoryField
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public string FieldType { get; set; } = "string"; // string | number | date | datetime | dropdown
    public bool IsRequired { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;

    public Category Category { get; set; } = null!;
    public ICollection<CategoryFieldOption> Options { get; set; } = new List<CategoryFieldOption>();
    public ICollection<DocumentFieldValue> Values { get; set; } = new List<DocumentFieldValue>();
}
