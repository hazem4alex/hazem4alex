using DocArchive.API.Data;
using DocArchive.API.DTOs.Categories;
using DocArchive.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Services;

public class CategoryService(AppDbContext db)
{
    public async Task<List<CategoryDto>> GetTreeAsync(string role = "Admin", int userId = 0)
    {
        var query = db.Categories
            .Include(c => c.Fields.Where(f => f.IsActive))
                .ThenInclude(f => f.Options.OrderBy(o => o.DisplayOrder))
            .Where(c => c.IsActive);

        // Users only see categories they have explicit access to
        if (role == "User" && userId > 0)
        {
            var accessibleIds = await db.UserCategoryAccess
                .Where(a => a.UserId == userId)
                .Select(a => a.CategoryId)
                .ToListAsync();
            query = query.Where(c => accessibleIds.Contains(c.Id));
        }

        var all = await query.OrderBy(c => c.Name_EN).ToListAsync();
        var lookup = all.ToLookup(c => c.ParentId);
        return BuildTree(lookup, null);
    }

    private static List<CategoryDto> BuildTree(ILookup<int?, Category> lookup, int? parentId)
    {
        return lookup[parentId].Select(c =>
        {
            var children = BuildTree(lookup, c.Id);
            return new CategoryDto
            {
                Id = c.Id,
                ParentId = c.ParentId,
                Name_AR = c.Name_AR,
                Name_EN = c.Name_EN,
                Description_AR = c.Description_AR,
                Description_EN = c.Description_EN,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                IsLeaf = !children.Any(),
                Children = children,
                Fields = children.Any() ? new() : c.Fields
                    .Where(f => f.IsActive)
                    .OrderBy(f => f.DisplayOrder)
                    .Select(MapField)
                    .ToList()
            };
        }).ToList();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await db.Categories
            .Include(x => x.Fields.Where(f => f.IsActive))
                .ThenInclude(f => f.Options.OrderBy(o => o.DisplayOrder))
            .Include(x => x.Children)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (c is null) return null;

        return new CategoryDto
        {
            Id = c.Id,
            ParentId = c.ParentId,
            Name_AR = c.Name_AR,
            Name_EN = c.Name_EN,
            Description_AR = c.Description_AR,
            Description_EN = c.Description_EN,
            IsActive = c.IsActive,
            CreatedAt = c.CreatedAt,
            IsLeaf = !c.Children.Any(ch => ch.IsActive),
            Fields = c.Fields.OrderBy(f => f.DisplayOrder).Select(MapField).ToList()
        };
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryRequest req, int userId)
    {
        var cat = new Category
        {
            ParentId = req.ParentId,
            Name_AR = req.Name_AR,
            Name_EN = req.Name_EN,
            Description_AR = req.Description_AR,
            Description_EN = req.Description_EN,
            CreatedBy = userId
        };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();
        return (await GetByIdAsync(cat.Id))!;
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryRequest req, int userId)
    {
        var cat = await db.Categories
            .Include(c => c.Fields)
                .ThenInclude(f => f.Options)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (cat is null) return null;

        cat.ParentId = req.ParentId;
        cat.Name_AR = req.Name_AR;
        cat.Name_EN = req.Name_EN;
        cat.Description_AR = req.Description_AR;
        cat.Description_EN = req.Description_EN;
        cat.IsActive = req.IsActive;

        // Sync fields
        var existingFieldIds = cat.Fields.Select(f => f.Id).ToHashSet();
        var incomingFieldIds = req.Fields.Where(f => f.Id.HasValue).Select(f => f.Id!.Value).ToHashSet();

        // Soft-delete removed fields
        foreach (var field in cat.Fields.Where(f => !incomingFieldIds.Contains(f.Id)))
            field.IsActive = false;

        foreach (var fr in req.Fields)
        {
            if (fr.Id.HasValue && existingFieldIds.Contains(fr.Id.Value))
            {
                var field = cat.Fields.First(f => f.Id == fr.Id.Value);
                field.Label_AR = fr.Label_AR;
                field.Label_EN = fr.Label_EN;
                field.FieldType = fr.FieldType;
                field.IsRequired = fr.IsRequired;
                field.DisplayOrder = fr.DisplayOrder;
                field.IsActive = true;
                SyncOptions(field, fr.Options);
            }
            else
            {
                var newField = new CategoryField
                {
                    CategoryId = id,
                    Label_AR = fr.Label_AR,
                    Label_EN = fr.Label_EN,
                    FieldType = fr.FieldType,
                    IsRequired = fr.IsRequired,
                    DisplayOrder = fr.DisplayOrder,
                    Options = fr.Options.Select(o => new CategoryFieldOption
                    {
                        OptionValue = o.OptionValue,
                        Label_AR = o.Label_AR,
                        Label_EN = o.Label_EN,
                        DisplayOrder = o.DisplayOrder
                    }).ToList()
                };
                cat.Fields.Add(newField);
            }
        }

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    private static void SyncOptions(CategoryField field, List<SaveFieldOptionRequest> incoming)
    {
        var existing = field.Options.ToDictionary(o => o.Id);
        var incomingIds = incoming.Where(o => o.Id.HasValue).Select(o => o.Id!.Value).ToHashSet();

        foreach (var o in field.Options.Where(o => !incomingIds.Contains(o.Id)).ToList())
            field.Options.Remove(o);

        foreach (var or in incoming)
        {
            if (or.Id.HasValue && existing.TryGetValue(or.Id.Value, out var opt))
            {
                opt.OptionValue = or.OptionValue;
                opt.Label_AR = or.Label_AR;
                opt.Label_EN = or.Label_EN;
                opt.DisplayOrder = or.DisplayOrder;
            }
            else
            {
                field.Options.Add(new CategoryFieldOption
                {
                    OptionValue = or.OptionValue,
                    Label_AR = or.Label_AR,
                    Label_EN = or.Label_EN,
                    DisplayOrder = or.DisplayOrder
                });
            }
        }
    }

    private static CategoryFieldDto MapField(CategoryField f) => new()
    {
        Id = f.Id,
        CategoryId = f.CategoryId,
        Label_AR = f.Label_AR,
        Label_EN = f.Label_EN,
        FieldType = f.FieldType,
        IsRequired = f.IsRequired,
        DisplayOrder = f.DisplayOrder,
        Options = f.Options.OrderBy(o => o.DisplayOrder).Select(o => new FieldOptionDto
        {
            Id = o.Id,
            OptionValue = o.OptionValue,
            Label_AR = o.Label_AR,
            Label_EN = o.Label_EN,
            DisplayOrder = o.DisplayOrder
        }).ToList()
    };
}
