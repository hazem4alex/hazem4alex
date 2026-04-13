namespace DocArchive.API.Services;

public record ScannerInfo(string Id, string Name);

public class ScanRequest
{
    public string DeviceId { get; set; } = "";
    public int Resolution { get; set; } = 300;
    /// <summary>Color | Grayscale | BlackAndWhite</summary>
    public string ColorMode { get; set; } = "Color";
}

public class ScanResult
{
    public string Format { get; set; } = "JPEG";
    public string Base64 { get; set; } = "";
}

public interface IScanService
{
    bool IsAvailable { get; }
    List<ScannerInfo> GetDevices();
    Task<byte[]> ScanAsync(ScanRequest req);
}
