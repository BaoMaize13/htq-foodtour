using Microsoft.Maui.Storage;

#if ANDROID
using AndroidApp = Android.App.Application;
using Android.Provider;
#endif

namespace HTQSFR.Utilities;

public static class BootSessionHelper
{
    private const string LastBootCountKey = "last_boot_count";
    private const string SelectedLanguageKey = "selectedLanguage";

    public static void ResetLanguageIfDeviceRebooted()
    {
#if ANDROID
        int currentBootCount = GetAndroidBootCount();
        int savedBootCount = Preferences.Get(LastBootCountKey, -1);

        if (savedBootCount != -1 && currentBootCount != savedBootCount)
        {
            Preferences.Remove(SelectedLanguageKey);
        }

        Preferences.Set(LastBootCountKey, currentBootCount);
#endif
    }

#if ANDROID
    private static int GetAndroidBootCount()
    {
        var context = AndroidApp.Context;
        return Settings.Global.GetInt(context.ContentResolver, "boot_count", 0);
    }
#endif
}