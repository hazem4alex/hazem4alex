using System.Text.Json;
using DocArchive.API.Data;
using DocArchive.API.DTOs.Documents;
using DocArchive.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Services;

public class DocumentService(AppDbContext db)
{
    public async Task<DocumentDto> CreateAsync(CreateDocumentRequest req, int userId)
    {
        var doc = new Document
        {
            CategoryId = req.CategoryId,
            Title = req.Title,
            AddedBy = userId,
            LastModifiedBy = userId,
            FieldValues = req.FieldValues.Select(fv => new DocumentFieldValue
            {
                FieldId = fv.FieldId,
                FieldValue = fv.Value
            }).ToList()
        };

        db.Documents.Add(doc);
        await db.SaveChangesAsync();

        var snapshot = JsonSerializer.Serialize(req.FieldValues);
        db.DocumentHistory.Add(new DocumentHistory
        {
            DocumentId = doc.Id,
            ChangedBy = userId,
            ChangeType = "Created",
            FieldSnapshot = snapshot
        });
        await db.SaveChangesAsync();

        return (await GetByIdAsync(doc.Id))!;
    }

    public async Task<DocumentDto?> GetByIdAsync(int id)
    {
        var doc = await db.Documents
            .Include(d => d.Category)
            .Include(d => d.AddedByUser)
            .Include(d => d.LastModifiedByUser)
            .Include(d => d.FieldValues)
                .ThenInclude(fv => fv.Field)
            .Include(d => d.Files)
                .ThenInclude(f => f.UploadedByUser)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (doc is null) return null;
        return MapToDto(doc);
    }

    public async Task<DocumentDto?> UpdateAsync(int id, UpdateDocumentRequest req, int userId)
    {
        var doc = await db.Documents
            .Include(d => d.FieldValues)
            .FirstOrDefaultAsync(d => d.Id == id);
        if (doc is null) return null;

        var oldSnapshot = JsonSerializer.Serialize(doc.FieldValues.Select(fv => new { fv.FieldId, Value = fv.FieldValue }));

        doc.Title = req.Title;
        doc.Status = req.Status;
        doc.LastModified = DateTime.UtcNow;
        doc.LastModifiedBy = userId;

        // Sync field values
        var existingByFieldId = doc.FieldValues.ToDictionary(fv => fv.FieldId);
        foreach (var fvr in req.FieldValues)
        {
            if (existingByFieldId.TryGetValue(fvr.FieldId, out var existing))
                existing.FieldValue = fvr.Value;
            else
                doc.FieldValues.Add(new DocumentFieldValue { FieldId = fvr.FieldId, FieldValue = fvr.Value });
        }

        db.DocumentHistory.Add(new DocumentHistory
        {
            DocumentId = id,
            ChangedBy = userId,
            ChangeType = "Updated",
            FieldSnapshot = oldSnapshot
        });

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null) return false;

        doc.Status = "Deleted";
        doc.LastModified = DateTime.UtcNow;
        doc.LastModifiedBy = userId;

        db.DocumentHistory.Add(new DocumentHistory
        {
            DocumentId = id,
            ChangedBy = userId,
            ChangeType = "StatusChanged",
            FieldSnapshot = JsonSerializer.Serialize(new { Status = "Deleted" })
        });
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<PagedResult<DocumentDto>> SearchAsync(DocumentSearchRequest req)
    {
        var query = db.Documents
            .Include(d => d.Category)
            .Include(d => d.AddedByUser)
            .Include(d => d.LastModifiedByUser)
            .Include(d => d.FieldValues)
                .ThenInclude(fv => fv.Field)
            .Include(d => d.Files)
                .ThenInclude(f => f.UploadedByUser)
            .Where(d => d.Status != "Deleted")
            .AsQueryable();

        if (req.CategoryId.HasValue)
            query = query.Where(d => d.CategoryId == req.CategoryId.Value);

        if (!string.IsNullOrWhiteSpace(req.TitleContains))
            query = query.Where(d => d.Title.Contains(req.TitleContains));

        if (req.AddedBy.HasValue)
            query = query.Where(d => d.AddedBy == req.AddedBy.Value);

        if (req.EntryDateFrom.HasValue)
            query = query.Where(d => d.EntryDatetime >= req.EntryDateFrom.Value);

        if (req.EntryDateTo.HasValue)
            query = query.Where(d => d.EntryDatetime <= req.EntryDateTo.Value.AddDays(1));

        if (!string.IsNullOrWhiteSpace(req.Status))
            query = query.Where(d => d.Status == req.Status);

        // EAV field filters
        foreach (var filter in req.FieldFilters)
        {
            int fid = filter.FieldId;
            string val = filter.Value;
            query = filter.Operator switch
            {
                "equals" => query.Where(d => d.FieldValues.Any(fv => fv.FieldId == fid && fv.FieldValue == val)),
                "startsWith" => query.Where(d => d.FieldValues.Any(fv => fv.FieldId == fid && fv.FieldValue != null && fv.FieldValue.StartsWith(val))),
                _ => query.Where(d => d.FieldValues.Any(fv => fv.FieldId == fid && fv.FieldValue != null && fv.FieldValue.Contains(val)))
            };
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(d => d.EntryDatetime)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync();

        return new PagedResult<DocumentDto>
        {
            Items = items.Select(MapToDto).ToList(),
            TotalCount = total,
            Page = req.Page,
            PageSize = req.PageSize
        };
    }

    public async Task<List<DocumentHistoryDto>> GetHistoryAsync(int documentId)
    {
        return await db.DocumentHistory
            .Include(h => h.ChangedByUser)
            .Where(h => h.DocumentId == documentId)
            .OrderByDescending(h => h.ChangedAt)
            .Select(h => new DocumentHistoryDto
            {
                Id = h.Id,
                ChangeType = h.ChangeType,
                ChangedAt = h.ChangedAt,
                ChangedByName_AR = h.ChangedByUser.FullName_AR,
                ChangedByName_EN = h.ChangedByUser.FullName_EN,
                FieldSnapshot = h.FieldSnapshot
            })
            .ToListAsync();
    }

    private static DocumentDto MapToDto(Document doc) => new()
    {
        Id = doc.Id,
        CategoryId = doc.CategoryId,
        CategoryName_AR = doc.Category?.Name_AR ?? string.Empty,
        CategoryName_EN = doc.Category?.Name_EN ?? string.Empty,
        Title = doc.Title,
        Status = doc.Status,
        EntryDatetime = doc.EntryDatetime,
        AddedBy = doc.AddedBy,
        AddedByName_AR = doc.AddedByUser?.FullName_AR ?? string.Empty,
        AddedByName_EN = doc.AddedByUser?.FullName_EN ?? string.Empty,
        LastModified = doc.LastModified,
        LastModifiedBy = doc.LastModifiedBy,
        LastModifiedByName_AR = doc.LastModifiedByUser?.FullName_AR ?? string.Empty,
        LastModifiedByName_EN = doc.LastModifiedByUser?.FullName_EN ?? string.Empty,
        FieldValues = doc.FieldValues.Select(fv => new FieldValueDto
        {
            FieldId = fv.FieldId,
            Label_AR = fv.Field?.Label_AR ?? string.Empty,
            Label_EN = fv.Field?.Label_EN ?? string.Empty,
            FieldType = fv.Field?.FieldType ?? string.Empty,
            Value = fv.FieldValue
        }).ToList(),
        Files = doc.Files.Select(f => new DocumentFileDto
        {
            Id = f.Id,
            OriginalFileName = f.OriginalFileName,
            MimeType = f.MimeType,
            FileSizeBytes = f.FileSizeBytes,
            UploadedAt = f.UploadedAt,
            UploadedByName_AR = f.UploadedByUser?.FullName_AR ?? string.Empty,
            UploadedByName_EN = f.UploadedByUser?.FullName_EN ?? string.Empty
        }).ToList()
    };
}
