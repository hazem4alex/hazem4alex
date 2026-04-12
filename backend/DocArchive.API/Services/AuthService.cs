using DocArchive.API.Data;
using DocArchive.API.DTOs.Auth;
using DocArchive.API.Helpers;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Services;

public class AuthService(AppDbContext db, JwtHelper jwt)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);
        if (user is null) return null;

        bool valid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!valid) return null;

        return new LoginResponse
        {
            Token = jwt.GenerateToken(user),
            UserId = user.Id,
            Username = user.Username,
            FullName_AR = user.FullName_AR,
            FullName_EN = user.FullName_EN,
            Role = user.Role,
            ExpiresAt = jwt.GetExpiry()
        };
    }
}
