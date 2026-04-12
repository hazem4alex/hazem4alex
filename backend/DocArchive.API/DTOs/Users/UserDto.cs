namespace DocArchive.API.DTOs.Users;

public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FullName_AR { get; set; } = string.Empty;
    public string FullName_EN { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName_AR { get; set; } = string.Empty;
    public string FullName_EN { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
}

public class UpdateUserRequest
{
    public string? Password { get; set; }
    public string FullName_AR { get; set; } = string.Empty;
    public string FullName_EN { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public bool IsActive { get; set; } = true;
}
