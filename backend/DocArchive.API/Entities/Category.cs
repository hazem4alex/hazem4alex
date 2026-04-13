namespace DocArchive.API.Entities;

public class Category
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name_AR { get; set; } = string.Empty;
    public string Name_EN { get; set; } = string.Empty;
    public string? Description_AR { get; set; }
    public string? Description_EN { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsUserAccessible { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int CreatedBy { get; set; }

    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public User Creator { get; set; } = null!;
    public ICollection<CategoryField> Fields { get; set; } = new List<CategoryField>();
    public ICollection<Document> Documents { get; set; } = new List<Document>();
}
