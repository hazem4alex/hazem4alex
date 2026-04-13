using DocArchive.API.DTOs.Auth;
using DocArchive.API.DTOs.Users;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService, UserService userService) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { error = "Invalid username or password." });
        return Ok(result);
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest(new { error = "Password cannot be empty." });

        var ok = await userService.ChangePasswordAsync(CurrentUserId, req.NewPassword);
        return ok ? NoContent() : NotFound();
    }
}
