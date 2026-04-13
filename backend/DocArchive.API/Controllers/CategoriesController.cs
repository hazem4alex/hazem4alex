using DocArchive.API.DTOs.Categories;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController(CategoryService categoryService) : ControllerBase
{
    private int CurrentUserId => int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "User";
        return Ok(await categoryService.GetTreeAsync(role));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cat = await categoryService.GetByIdAsync(id);
        return cat is null ? NotFound() : Ok(cat);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest req)
    {
        var created = await categoryService.CreateAsync(req, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryRequest req)
    {
        var updated = await categoryService.UpdateAsync(id, req, CurrentUserId);
        return updated is null ? NotFound() : Ok(updated);
    }
}
