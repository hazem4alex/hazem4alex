namespace DocArchive.API.Entities;

public class CategoryFieldOption
{
    public int Id { get; set; }
    public int FieldId { get; set; }
    public string OptionValue { get; set; } = string.Empty;
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public int DisplayOrder { get; set; } = 0;

    public CategoryField Field { get; set; } = null!;
}
