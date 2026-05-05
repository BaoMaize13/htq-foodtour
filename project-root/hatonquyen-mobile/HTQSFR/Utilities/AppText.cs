using HTQSFR.Services;
using Microsoft.Maui.Controls;

namespace HTQSFR.Utilities;

public static class AppText
{
    public static event EventHandler? LanguageChanged;

    public static string CurrentLanguageCode =>
        LanguageService.Current.CurrentLanguage;

    public static string T(string key)
    {
        return LanguageService.Current.GetText(key);
    }

    public static string T(string key, params object[] args)
    {
        string text = LanguageService.Current.GetText(key);

        try
        {
            return string.Format(text, args);
        }
        catch
        {
            return text;
        }
    }

    public static FlowDirection GetFlowDirection()
    {
        return LanguageService.Current.GetFlowDirection();
    }

    public static Task InitializeAsync()
    {
        return LanguageService.Current.InitializeAsync();
    }

    public static async Task SetLanguageAsync(string languageCode)
    {
        string oldLanguage = CurrentLanguageCode;

        await LanguageService.Current.SetLanguageAsync(languageCode);

        if (!string.Equals(oldLanguage, CurrentLanguageCode, StringComparison.OrdinalIgnoreCase))
        {
            LanguageChanged?.Invoke(null, EventArgs.Empty);
        }
    }
}