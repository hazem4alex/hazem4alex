using System.Text;
using DocArchive.API.Data;
using DocArchive.API.Helpers;
using DocArchive.API.Middleware;
using DocArchive.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// File storage (switch based on config)
var storageMode = builder.Configuration["FileStorage:Mode"] ?? "FileSystem";
if (storageMode == "Database")
    builder.Services.AddScoped<IFileStorageService, DatabaseFileStorageService>();
else
    builder.Services.AddScoped<IFileStorageService, FilesystemFileStorageService>();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<DocumentService>();
builder.Services.AddScoped<JwtHelper>();

// Scanner service — WIA is only available on Windows; on other platforms
// ISAvailable returns false and the controller returns 503.
builder.Services.AddSingleton<IScanService, WiaScanService>();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

// CORS for development (React dev server)
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "DocArchive API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Run migrations and seed on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>()
        .CreateLogger("Startup");
    try
    {
        db.Database.Migrate();
    }
    catch (Exception ex)
    {
        startupLogger.LogWarning(ex, "Migration step failed — DB may already be current. Continuing startup.");
    }
    try
    {
        db.SeedAdminUser(); // ensures admin/Admin@123 always works
    }
    catch (Exception ex)
    {
        startupLogger.LogError(ex, "SeedAdminUser failed.");
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("DevPolicy");
}

// Serve React SPA from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback — all non-API routes return index.html
app.MapFallbackToFile("index.html");

app.Run();
