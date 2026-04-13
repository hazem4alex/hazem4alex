using DocArchive.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocArchive.API.Controllers;

[ApiController]
[Route("api/scan")]
[Authorize]
public class ScanController(IScanService scanner) : ControllerBase
{
    /// <summary>Returns the list of WIA scanners connected to the server.</summary>
    [HttpGet("devices")]
    public IActionResult GetDevices() => Ok(scanner.GetDevices());

    /// <summary>
    /// Acquires one page from the specified scanner and returns the image
    /// as a base64-encoded JPEG.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Scan([FromBody] ScanRequest req)
    {
        if (!scanner.IsAvailable)
            return StatusCode(503, new { message = "Scanner service is not available on this server." });

        try
        {
            var bytes = await scanner.ScanAsync(req);
            return Ok(new ScanResult
            {
                Format = "JPEG",
                Base64 = Convert.ToBase64String(bytes),
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (PlatformNotSupportedException ex)
        {
            return StatusCode(503, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Scan failed: {ex.Message}" });
        }
    }
}
