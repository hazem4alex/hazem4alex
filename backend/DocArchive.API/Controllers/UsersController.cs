using DocArchive.API.DTOs.Users;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController(UserService userService) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await userService.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await userService.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
    {
        var created = await userService.CreateAsync(req, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest req)
    {
        var updated = await userService.UpdateAsync(id, req);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPut("{id:int}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NewPassword))
            return BadRequest(new { error = "Password cannot be empty." });

        var ok = await userService.ChangePasswordAsync(id, req.NewPassword);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("{id:int}/categories")]
    public async Task<IActionResult> GetCategories(int id)
        => Ok(await userService.GetUserCategoriesAsync(id));

    [HttpPut("{id:int}/categories")]
    public async Task<IActionResult> SetCategories(int id, [FromBody] SetUserCategoriesRequest req)
    {
        await userService.SetUserCategoriesAsync(id, req.CategoryIds);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await userService.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
