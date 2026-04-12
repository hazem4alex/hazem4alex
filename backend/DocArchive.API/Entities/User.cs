namespace DocArchive.API.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName_AR { get; set; } = string.Empty;
    public string FullName_EN { get; set; } = string.Empty;
    public string Role { get; set; } = "User"; // Admin | Manager | User
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedBy { get; set; }

    public User? Creator { get; set; }
    public ICollection<Category> CreatedCategories { get; set; } = new List<Category>();
    public ICollection<Document> AddedDocuments { get; set; } = new List<Document>();
    public ICollection<DocumentHistory> HistoryEntries { get; set; } = new List<DocumentHistory>();
}
