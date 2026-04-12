using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DocArchive.API.Entities;
using Microsoft.IdentityModel.Tokens;

namespace DocArchive.API.Helpers;

public class JwtHelper(IConfiguration config)
{
    public string GenerateToken(User user)
    {
        var secret = config["Jwt:SecretKey"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var hours = int.Parse(config["Jwt:ExpiryHours"] ?? "8");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("fullName_AR", user.FullName_AR),
            new Claim("fullName_EN", user.FullName_EN),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(hours),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTime GetExpiry()
    {
        var hours = int.Parse(config["Jwt:ExpiryHours"] ?? "8");
        return DateTime.UtcNow.AddHours(hours);
    }
}
