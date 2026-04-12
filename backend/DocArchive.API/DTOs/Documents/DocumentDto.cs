namespace DocArchive.API.DTOs.Documents;

public class DocumentDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName_AR { get; set; } = string.Empty;
    public string CategoryName_EN { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime EntryDatetime { get; set; }
    public int AddedBy { get; set; }
    public string AddedByName_AR { get; set; } = string.Empty;
    public string AddedByName_EN { get; set; } = string.Empty;
    public DateTime LastModified { get; set; }
    public int LastModifiedBy { get; set; }
    public string LastModifiedByName_AR { get; set; } = string.Empty;
    public string LastModifiedByName_EN { get; set; } = string.Empty;
    public List<FieldValueDto> FieldValues { get; set; } = new();
    public List<DocumentFileDto> Files { get; set; } = new();
}

public class FieldValueDto
{
    public int FieldId { get; set; }
    public string Label_AR { get; set; } = string.Empty;
    public string Label_EN { get; set; } = string.Empty;
    public string FieldType { get; set; } = string.Empty;
    public string? Value { get; set; }
}

public class DocumentFileDto
{
    public int Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
    public string UploadedByName_AR { get; set; } = string.Empty;
    public string UploadedByName_EN { get; set; } = string.Empty;
}

public class DocumentHistoryDto
{
    public int Id { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
    public string ChangedByName_AR { get; set; } = string.Empty;
    public string ChangedByName_EN { get; set; } = string.Empty;
    public string? FieldSnapshot { get; set; }
}

public class CreateDocumentRequest
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<FieldValueRequest> FieldValues { get; set; } = new();
}

public class UpdateDocumentRequest
{
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Active";
    public List<FieldValueRequest> FieldValues { get; set; } = new();
}

public class FieldValueRequest
{
    public int FieldId { get; set; }
    public string? Value { get; set; }
}

public class DocumentSearchRequest
{
    public int? CategoryId { get; set; }
    public string? TitleContains { get; set; }
    public int? AddedBy { get; set; }
    public DateTime? EntryDateFrom { get; set; }
    public DateTime? EntryDateTo { get; set; }
    public string? Status { get; set; }
    public List<FieldFilterRequest> FieldFilters { get; set; } = new();
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class FieldFilterRequest
{
    public int FieldId { get; set; }
    public string Operator { get; set; } = "contains"; // contains | equals | startsWith
    public string Value { get; set; } = string.Empty;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
