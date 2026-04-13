using System.Runtime.ExceptionServices;
using System.Runtime.InteropServices;

namespace DocArchive.API.Services;

/// <summary>
/// Communicates with locally connected scanners via the Windows Image Acquisition (WIA)
/// Automation Layer (wiaaut.dll). Uses COM late-binding so no interop assembly is required.
/// All COM calls are marshalled onto an STA thread, as required by WIA.
/// On non-Windows systems <see cref="IsAvailable"/> returns false and no COM calls are made.
/// </summary>
public class WiaScanService : IScanService
{
    // WIA device type constant: 1 = Scanner
    private const int ScannerDeviceType = 1;

    // WIA Automation Layer image format GUIDs
    private const string JpegFormatGuid = "{B96B3CAE-0728-11D3-9D7B-0000F81EF32E}";

    // WIA item property IDs
    private const int PropHorizontalResolution = 6147; // WIA_IPS_XRES
    private const int PropVerticalResolution   = 6148; // WIA_IPS_YRES
    private const int PropCurrentIntent        = 4103; // WIA_IPS_CUR_INTENT

    // WIA_IPS_CUR_INTENT values
    private const int IntentColor     = 1;
    private const int IntentGrayscale = 2;
    private const int IntentText      = 4; // Black & White

    public bool IsAvailable =>
        RuntimeInformation.IsOSPlatform(OSPlatform.Windows) &&
        Type.GetTypeFromProgID("WIA.DeviceManager") is not null;

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public List<ScannerInfo> GetDevices()
    {
        if (!IsAvailable) return [];
        try
        {
            return RunOnSta(() =>
            {
                var list = new List<ScannerInfo>();
                dynamic dm = CreateDeviceManager();
                foreach (dynamic info in dm.DeviceInfos)
                {
                    if ((int)info.Type == ScannerDeviceType)
                        list.Add(new ScannerInfo((string)info.DeviceID, GetPropertyValue(info.Properties, "Name")));
                }
                return list;
            });
        }
        catch
        {
            return [];
        }
    }

    public Task<byte[]> ScanAsync(ScanRequest req)
    {
        if (!IsAvailable)
            throw new PlatformNotSupportedException("WIA is not available on this system.");

        return Task.Run(() => RunOnSta(() =>
        {
            dynamic dm = CreateDeviceManager();

            // Locate the requested device
            dynamic? targetInfo = null;
            foreach (dynamic info in dm.DeviceInfos)
            {
                if ((string)info.DeviceID == req.DeviceId)
                {
                    targetInfo = info;
                    break;
                }
            }
            if (targetInfo is null)
                throw new KeyNotFoundException($"Scanner '{req.DeviceId}' not found.");

            dynamic device = targetInfo.Connect();
            dynamic item = device.Items[1]; // First item: flatbed/ADF

            // Apply scan settings — wrap each set in try/catch because some scanners
            // expose read-only or unavailable properties.
            TrySetProperty(item.Properties, PropHorizontalResolution, req.Resolution);
            TrySetProperty(item.Properties, PropVerticalResolution,   req.Resolution);
            TrySetProperty(item.Properties, PropCurrentIntent, req.ColorMode switch
            {
                "Grayscale"      => IntentGrayscale,
                "BlackAndWhite"  => IntentText,
                _                => IntentColor
            });

            // Transfer (acquire the scan)
            dynamic img = item.Transfer(JpegFormatGuid);
            return (byte[])img.FileData.BinaryData;
        }));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static dynamic CreateDeviceManager()
    {
        var type = Type.GetTypeFromProgID("WIA.DeviceManager")
            ?? throw new PlatformNotSupportedException("WIA.DeviceManager COM class not found.");
        return Activator.CreateInstance(type)!;
    }

    private static string GetPropertyValue(dynamic properties, string name)
    {
        try
        {
            foreach (dynamic prop in properties)
                if (prop.Name == name)
                    return prop.Value?.ToString() ?? "";
        }
        catch { /* ignore */ }
        return "";
    }

    private static void TrySetProperty(dynamic properties, int propId, object value)
    {
        try { properties[propId].Value = value; }
        catch { /* property not settable on this device — ignore */ }
    }

    /// <summary>
    /// Runs <paramref name="func"/> on a freshly created STA thread and
    /// returns its result, re-throwing any exception on the calling thread.
    /// WIA COM objects require STA apartment state.
    /// </summary>
    private static T RunOnSta<T>(Func<T> func)
    {
        T result = default!;
        ExceptionDispatchInfo? edi = null;

        var thread = new Thread(() =>
        {
            try   { result = func(); }
            catch (Exception ex) { edi = ExceptionDispatchInfo.Capture(ex); }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        thread.Join();

        edi?.Throw();
        return result;
    }
}
