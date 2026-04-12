# DocArchive — Setup Guide

## Prerequisites

- Windows Server / Windows 10+
- SQL Server 2019
- .NET 8 SDK (https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js 18+ (https://nodejs.org)
- IIS with .NET Core Hosting Bundle

---

## 1. Database Configuration

Edit `backend/DocArchive.API/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=DocArchiveDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

---

## 2. Run Database Migration

```powershell
cd backend/DocArchive.API
dotnet ef database update
```

This creates all tables and seeds the default admin user:
- **Username**: `admin`
- **Password**: `Admin@123`

> **Important**: Change the admin password immediately after first login.

---

## 3. File Storage Configuration

In `appsettings.json`, choose storage mode:

```json
{
  "FileStorage": {
    "Mode": "FileSystem",
    "FileSystemPath": "C:\\DocArchive\\Files"
  }
}
```

- `"FileSystem"` (recommended) — files saved to disk
- `"Database"` — files stored as binary in SQL Server

Make sure the IIS application pool identity has **write access** to the FileSystemPath folder.

---

## 4. Build Frontend

```powershell
cd frontend/docarchive-ui
npm install
npm run build
```

The build output is automatically placed in `backend/DocArchive.API/wwwroot/`.

---

## 5. Publish Backend

```powershell
cd backend/DocArchive.API
dotnet publish -c Release -o ./publish
```

---

## 6. IIS Deployment

1. Install **.NET 8 Hosting Bundle** on the server
2. Create a new IIS website pointing to `backend/DocArchive.API/publish/`
3. Set Application Pool: **No Managed Code**
4. Ensure the app pool identity can access the database and file storage path

---

## 7. JWT Secret

Before production, set a strong secret in `appsettings.Production.json`:
```json
{
  "Jwt": {
    "SecretKey": "YOUR_STRONG_RANDOM_SECRET_AT_LEAST_32_CHARS"
  }
}
```

---

## Default Admin Credentials

| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `Admin@123` |

> Change after first login via **Users** menu.

---

## EF Migration (generate SQL script for DBA review)

```powershell
cd backend/DocArchive.API
dotnet ef migrations add InitialCreate
dotnet ef migrations script --idempotent -o migrate.sql
```
