using DocArchive.API.Data;
using DocArchive.API.DTOs.Users;
using DocArchive.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Services;

public class UserService(AppDbContext db)
{
    public async Task<List<UserDto>> GetAllAsync()
    {
        return await db.Users
            .OrderBy(u => u.Username)
            .Select(u => ToDto(u))
            .ToListAsync();
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var u = await db.Users.FindAsync(id);
        return u is null ? null : ToDto(u);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest req, int createdBy)
    {
        var user = new User
        {
            Username = req.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FullName_AR = req.FullName_AR,
            FullName_EN = req.FullName_EN,
            Role = req.Role,
            IsActive = req.IsActive,
            CreatedBy = createdBy
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<UserDto?> UpdateAsync(int id, UpdateUserRequest req)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return null;

        if (!string.IsNullOrWhiteSpace(req.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);

        user.FullName_AR = req.FullName_AR;
        user.FullName_EN = req.FullName_EN;
        user.Role = req.Role;
        user.IsActive = req.IsActive;
        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return false;
        user.IsActive = false;
        await db.SaveChangesAsync();
        return true;
    }

    private static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        Username = u.Username,
        FullName_AR = u.FullName_AR,
        FullName_EN = u.FullName_EN,
        Role = u.Role,
        IsActive = u.IsActive,
        CreatedAt = u.CreatedAt
    };
}
