using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using HTQSFR.Utilities;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices;

namespace HTQSFR.Services;

public static class PresenceService
{
    private static readonly HttpClient HttpClient = new()
    {
        BaseAddress = new Uri(ApiConfig.BaseUrl),
        Timeout = TimeSpan.FromSeconds(15)
    };

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true
    };

    private static CancellationTokenSource? _heartbeatCancellationTokenSource;
    private static bool _heartbeatStarted;

    public static async Task StartPresenceAsync()
    {
        try
        {
            var payload = new PresenceStartRequest
            {
                InstallationId = DeviceSessionService.GetInstallationId(),
                AppSessionId = DeviceSessionService.GetCurrentAppSessionId(),
                Platform = GetPlatformName(),
                AppVersion = AppInfo.Current.VersionString,
                Language = GetCurrentLanguage(),
            };

            using var response = await HttpClient.PostAsJsonAsync(
                "analytics/presence/start",
                payload,
                JsonOptions);

            _ = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return;

            await SendHeartbeatAsync();
            EnsureHeartbeatStarted();
        }
        catch
        {
            // Không để analytics làm hỏng flow chính của app.
        }
    }

    public static async Task IdentifyCurrentSessionAsync()
    {
        try
        {
            string? token = await AuthSessionService.GetAccessTokenAsync();

            if (string.IsNullOrWhiteSpace(token))
                return;

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                "analytics/presence/identify");

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            request.Content = JsonContent.Create(
                new PresenceIdentifyRequest
                {
                    AppSessionId = DeviceSessionService.GetCurrentAppSessionId()
                },
                mediaType: null,
                options: JsonOptions);

            using var response = await HttpClient.SendAsync(request);
            _ = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return;

            await SendHeartbeatAsync();
            EnsureHeartbeatStarted();
        }
        catch
        {
            // Không để analytics làm hỏng flow chính của app.
        }
    }

    public static void EnsureHeartbeatStarted()
    {
        if (_heartbeatStarted)
            return;

        _heartbeatStarted = true;
        _heartbeatCancellationTokenSource = new CancellationTokenSource();

        Task.Run(async () =>
        {
            while (!_heartbeatCancellationTokenSource.IsCancellationRequested)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(30), _heartbeatCancellationTokenSource.Token);
                    await SendHeartbeatAsync();
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch
                {
                    // Bỏ qua lỗi heartbeat.
                }
            }
        });
    }

    public static void StopHeartbeat()
    {
        try
        {
            _heartbeatCancellationTokenSource?.Cancel();
            _heartbeatCancellationTokenSource?.Dispose();
        }
        catch
        {
        }
        finally
        {
            _heartbeatCancellationTokenSource = null;
            _heartbeatStarted = false;
        }
    }

    private static async Task SendHeartbeatAsync()
    {
        try
        {
            var payload = new PresenceHeartbeatRequest
            {
                AppSessionId = DeviceSessionService.GetCurrentAppSessionId()
            };

            using var response = await HttpClient.PostAsJsonAsync(
                "analytics/presence/heartbeat",
                payload,
                JsonOptions);

            _ = await response.Content.ReadAsStringAsync();
        }
        catch
        {
            // ignore
        }
    }

    private static string GetCurrentLanguage()
    {
        string code = AppText.CurrentLanguageCode;

        if (string.IsNullOrWhiteSpace(code))
            return "vi";

        return code.Trim();
    }

    private static string GetPlatformName()
    {
        if (DeviceInfo.Platform == DevicePlatform.Android)
            return "android";

        if (DeviceInfo.Platform == DevicePlatform.iOS)
            return "ios";

        if (DeviceInfo.Platform == DevicePlatform.WinUI)
            return "windows";

        return DeviceInfo.Platform.ToString().ToLowerInvariant();
    }

    private sealed class PresenceStartRequest
    {
        public string InstallationId { get; set; } = string.Empty;
        public string AppSessionId { get; set; } = string.Empty;
        public string Platform { get; set; } = string.Empty;
        public string AppVersion { get; set; } = string.Empty;
        public string Language { get; set; } = "vi";
    }

    private sealed class PresenceHeartbeatRequest
    {
        public string AppSessionId { get; set; } = string.Empty;
    }

    private sealed class PresenceIdentifyRequest
    {
        public string AppSessionId { get; set; } = string.Empty;
    }
}