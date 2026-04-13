namespace DocArchive.API.DTOs.Categories;

public class CategoryDto
{
    public int Id { get; set; }
    public int? ParentId { get; set; }
    public string Name_AR { get; set; } = string.Empty;
    public string Name_EN { get; set; } = string.Empty;
    public string? Description_AR { get; set; }
    public string? Description_EN { get; set; }
    public bool IsActive { get; set; }
    public bool IsUserAccessible { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsLeaf { get; set; } // no children
    public List<CategoryDto> Children { get; set; } = new();
    public List<CategoryFieldDto> Fields { get; set; } = new();
}

public class CategoryFieldDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public string FieldType { get; set; } = "string";
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public List<FieldOptionDto> Options { get; set; } = new();
}

public class FieldOptionDto
{
    public int Id { get; set; }
    public string OptionValue { get; set; } = string.Empty;
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class CreateCategoryRequest
{
    public int? ParentId { get; set; }
    public string Name_AR { get; set; } = string.Empty;
    public string Name_EN { get; set; } = string.Empty;
    public string? Description_AR { get; set; }
    public string? Description_EN { get; set; }
}

public class UpdateCategoryRequest
{
    public int? ParentId { get; set; }
    public string Name_AR { get; set; } = string.Empty;
    public string Name_EN { get; set; } = string.Empty;
    public string? Description_AR { get; set; }
    public string? Description_EN { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsUserAccessible { get; set; } = false;
    public List<SaveFieldRequest> Fields { get; set; } = new();
}

public class SaveFieldRequest
{
    public int? Id { get; set; }
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public string FieldType { get; set; } = "string";
    public bool IsRequired { get; set; }
    public int DisplayOrder { get; set; }
    public List<SaveFieldOptionRequest> Options { get; set; } = new();
}

public class SaveFieldOptionRequest
{
    public int? Id { get; set; }
    public string OptionValue { get; set; } = string.Empty;
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}
