namespace DocArchive.API.Entities;

public class UserCategoryAccess
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CategoryId { get; set; }

    public User User { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
