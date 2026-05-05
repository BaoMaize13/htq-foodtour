using Microsoft.Maui.Storage;

namespace HTQSFR.Utilities;

public enum MapMode
{
    Cloud,
    Offline,
    Hybrid
}

public static class MapConfig
{
    private const string PreferredModeKey = "preferred_map_mode";
    private const string ActivePackVersionKey = "active_map_pack_version";
    private const string ActivePackReadyKey = "active_map_pack_ready";

    public static MapMode GetPreferredMode()
    {
        string raw = Preferences.Default.Get(PreferredModeKey, "Hybrid");

        return Enum.TryParse<MapMode>(raw, true, out var parsed)
            ? parsed
            : MapMode.Hybrid;
    }

    public static void SetPreferredMode(MapMode mode)
    {
        Preferences.Default.Set(PreferredModeKey, mode.ToString());
    }

    public static string GetActivePackVersion()
    {
        return Preferences.Default.Get(ActivePackVersionKey, string.Empty);
    }

    public static void SetActivePackVersion(string version)
    {
        Preferences.Default.Set(ActivePackVersionKey, version ?? string.Empty);
    }

    public static bool IsActivePackReady()
    {
        return Preferences.Default.Get(ActivePackReadyKey, false);
    }

    public static void SetActivePackReady(bool isReady)
    {
        Preferences.Default.Set(ActivePackReadyKey, isReady);
    }

    public static void ResetPackState()
    {
        Preferences.Default.Remove(ActivePackVersionKey);
        Preferences.Default.Remove(ActivePackReadyKey);
    }
}