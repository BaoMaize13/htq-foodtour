using Microsoft.Maui.Storage;

namespace HTQSFR.Services;

public static class DeviceSessionService
{
    private const string InstallationIdKey = "installation_id";
    private const string AppSessionIdKey = "app_session_id";

    public static string GetInstallationId()
    {
        string id = Preferences.Default.Get(InstallationIdKey, string.Empty);

        if (string.IsNullOrWhiteSpace(id))
        {
            id = Guid.NewGuid().ToString("N");
            Preferences.Default.Set(InstallationIdKey, id);
        }

        return id;
    }

    public static string StartNewAppSession()
    {
        string sessionId = Guid.NewGuid().ToString("N");
        Preferences.Default.Set(AppSessionIdKey, sessionId);
        return sessionId;
    }

    public static string GetCurrentAppSessionId()
    {
        string sessionId = Preferences.Default.Get(AppSessionIdKey, string.Empty);

        if (string.IsNullOrWhiteSpace(sessionId))
        {
            sessionId = StartNewAppSession();
        }

        return sessionId;
    }
}