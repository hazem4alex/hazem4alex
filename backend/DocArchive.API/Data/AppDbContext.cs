using DocArchive.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace DocArchive.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryField> CategoryFields => Set<CategoryField>();
    public DbSet<CategoryFieldOption> CategoryFieldOptions => Set<CategoryFieldOption>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentFieldValue> DocumentFieldValues => Set<DocumentFieldValue>();
    public DbSet<DocumentFile> DocumentFiles => Set<DocumentFile>();
    public DbSet<DocumentFileContent> DocumentFileContents => Set<DocumentFileContent>();
    public DbSet<DocumentHistory> DocumentHistory => Set<DocumentHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Users
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Username).IsUnique();
            e.Property(x => x.Role).HasMaxLength(20);
            e.HasOne(x => x.Creator).WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.NoAction);
        });

        // Categories (self-referencing tree)
        modelBuilder.Entity<Category>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Parent).WithMany(x => x.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Creator).WithMany(x => x.CreatedCategories).HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.NoAction);
        });

        // CategoryFields
        modelBuilder.Entity<CategoryField>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FieldType).HasMaxLength(20);
            e.HasOne(x => x.Category).WithMany(x => x.Fields).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        // CategoryFieldOptions
        modelBuilder.Entity<CategoryFieldOption>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Field).WithMany(x => x.Options).HasForeignKey(x => x.FieldId).OnDelete(DeleteBehavior.Cascade);
        });

        // Documents
        modelBuilder.Entity<Document>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasOne(x => x.Category).WithMany(x => x.Documents).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.AddedByUser).WithMany(x => x.AddedDocuments).HasForeignKey(x => x.AddedBy).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.LastModifiedByUser).WithMany().HasForeignKey(x => x.LastModifiedBy).OnDelete(DeleteBehavior.NoAction);
        });

        // DocumentFieldValues (EAV)
        modelBuilder.Entity<DocumentFieldValue>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.DocumentId, x.FieldId }).IsUnique();
            e.HasIndex(x => new { x.FieldId, x.FieldValue });
            e.HasOne(x => x.Document).WithMany(x => x.FieldValues).HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Field).WithMany(x => x.Values).HasForeignKey(x => x.FieldId).OnDelete(DeleteBehavior.NoAction);
        });

        // DocumentFiles
        modelBuilder.Entity<DocumentFile>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.StorageMode).HasMaxLength(10);
            e.HasOne(x => x.Document).WithMany(x => x.Files).HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.UploadedByUser).WithMany().HasForeignKey(x => x.UploadedBy).OnDelete(DeleteBehavior.NoAction);
        });

        // DocumentFileContents (separate blob table)
        modelBuilder.Entity<DocumentFileContent>(e =>
        {
            e.HasKey(x => x.FileId);
            e.HasOne(x => x.File).WithOne(x => x.Content).HasForeignKey<DocumentFileContent>(x => x.FileId).OnDelete(DeleteBehavior.Cascade);
        });

        // DocumentHistory
        modelBuilder.Entity<DocumentHistory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.ChangeType).HasMaxLength(20);
            e.HasOne(x => x.Document).WithMany(x => x.History).HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ChangedByUser).WithMany(x => x.HistoryEntries).HasForeignKey(x => x.ChangedBy).OnDelete(DeleteBehavior.NoAction);
        });

    }

    // Called at startup to ensure the default admin user exists.
    // BCrypt hash is computed at runtime (cannot be computed at migration time).
    public void SeedAdminUser()
    {
        if (!Users.Any(u => u.Username == "admin"))
        {
            Users.Add(new Entities.User
            {
                Username = "admin",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName_AR = "مدير النظام",
                FullName_EN = "System Administrator",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = null
            });
            SaveChanges();
        }
    }
}
