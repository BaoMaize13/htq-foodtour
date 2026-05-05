using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System.Text.Json;

namespace HTQSFR.Services;

public sealed class LanguageService
{
    private const string LanguagePreferenceKey = "selectedLanguage";
    private const string DefaultLanguage = "en";

    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "vi",
        "en",
        "ko",
        "ja",
        "zh-Hans",
        "zh-Hant",
        "es",
        "de",
        "fr",
        "ru"
    };

    private static readonly Lazy<LanguageService> _instance =
        new(() => new LanguageService());

    public static LanguageService Current => _instance.Value;

    private Dictionary<string, string> _fallbackTexts =
        new(StringComparer.OrdinalIgnoreCase);

    private Dictionary<string, string> _currentTexts =
        new(StringComparer.OrdinalIgnoreCase);

    private bool _isInitialized;

    public string CurrentLanguage { get; private set; } = DefaultLanguage;

    private LanguageService()
    {
        string savedLanguage = Preferences.Get(LanguagePreferenceKey, DefaultLanguage);
        CurrentLanguage = NormalizeLanguageCode(savedLanguage);
    }

    public async Task InitializeAsync()
    {
        if (_isInitialized)
            return;

        await LoadLanguageAsync(CurrentLanguage);
        _isInitialized = true;
    }

    public async Task SetLanguageAsync(string languageCode)
    {
        await LoadLanguageAsync(languageCode);

        Preferences.Set(LanguagePreferenceKey, CurrentLanguage);
        _isInitialized = true;
    }

    public string GetText(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return string.Empty;

        EnsureLoadedSynchronouslyIfNeeded();

        if (_currentTexts.TryGetValue(key, out var currentValue) &&
            !string.IsNullOrWhiteSpace(currentValue))
        {
            return currentValue;
        }

        if (_fallbackTexts.TryGetValue(key, out var fallbackValue) &&
            !string.IsNullOrWhiteSpace(fallbackValue))
        {
            return fallbackValue;
        }

        return key;
    }

    public FlowDirection GetFlowDirection()
    {
        return CurrentLanguage is "ar" or "he"
            ? FlowDirection.RightToLeft
            : FlowDirection.LeftToRight;
    }

    private void EnsureLoadedSynchronouslyIfNeeded()
    {
        if (_isInitialized)
            return;

        try
        {
            InitializeAsync().GetAwaiter().GetResult();
        }
        catch
        {
            // Nếu load lỗi thì GetText sẽ fallback về key.
        }
    }

    private async Task LoadLanguageAsync(string languageCode)
    {
        string normalizedCode = NormalizeLanguageCode(languageCode);

        if (!SupportedLanguages.Contains(normalizedCode))
            normalizedCode = DefaultLanguage;

        if (_fallbackTexts.Count == 0)
        {
            _fallbackTexts = await ReadLanguageFileAsync(DefaultLanguage);
        }

        Dictionary<string, string> loadedTexts;

        if (normalizedCode.Equals(DefaultLanguage, StringComparison.OrdinalIgnoreCase))
        {
            loadedTexts = new Dictionary<string, string>(
                _fallbackTexts,
                StringComparer.OrdinalIgnoreCase);
        }
        else
        {
            loadedTexts = await ReadLanguageFileAsync(normalizedCode);
        }

        if (loadedTexts.Count == 0)
        {
            _currentTexts = new Dictionary<string, string>(
                _fallbackTexts,
                StringComparer.OrdinalIgnoreCase);

            CurrentLanguage = DefaultLanguage;
            return;
        }

        // Merge file ngôn ngữ đang chọn với English fallback.
        // Nhờ vậy nếu vi/ko/ja thiếu key mới, UI không bị hiện raw key hoặc kẹt English toàn app.
        var mergedTexts = new Dictionary<string, string>(
            _fallbackTexts,
            StringComparer.OrdinalIgnoreCase);

        foreach (var pair in loadedTexts)
        {
            if (!string.IsNullOrWhiteSpace(pair.Value))
                mergedTexts[pair.Key] = pair.Value;
        }

        _currentTexts = mergedTexts;
        CurrentLanguage = normalizedCode;
    }

    private static string NormalizeLanguageCode(string? languageCode)
    {
        if (string.IsNullOrWhiteSpace(languageCode))
            return DefaultLanguage;

        string code = languageCode.Trim();
        string lower = code.ToLowerInvariant().Replace("_", "-");

        return lower switch
        {
            "vietnamese" or "tieng-viet" or "tiếng-việt" or "vi-vn" or "vi" => "vi",
            "english" or "en-us" or "en-gb" or "en" => "en",
            "korean" or "ko-kr" or "ko" => "ko",
            "japanese" or "ja-jp" or "ja" => "ja",
            "spanish" or "es-es" or "es" => "es",
            "german" or "de-de" or "de" => "de",
            "french" or "fr-fr" or "fr" => "fr",
            "russian" or "ru-ru" or "ru" => "ru",

            "zh-hans" or "zh-cn" or "zh-sg" or "chinese-simplified" or "simplified-chinese" => "zh-Hans",
            "zh-hant" or "zh-tw" or "zh-hk" or "chinese-traditional" or "traditional-chinese" => "zh-Hant",

            _ => code
        };
    }

    private static async Task<Dictionary<string, string>> ReadLanguageFileAsync(string languageCode)
    {
        string[] candidatePaths =
        {
            $"Localization/{languageCode}.json",
            $"Resources/Raw/Localization/{languageCode}.json",
            $"{languageCode}.json"
        };

        foreach (string path in candidatePaths)
        {
            try
            {
                using Stream stream = await FileSystem.OpenAppPackageFileAsync(path);
                using StreamReader reader = new(stream, detectEncodingFromByteOrderMarks: true);
                string json = await reader.ReadToEndAsync();

                // Phòng trường hợp file JSON có UTF-8 BOM nhưng StreamReader không strip hết.
                json = json.TrimStart('﻿');

                Dictionary<string, string>? data =
                    JsonSerializer.Deserialize<Dictionary<string, string>>(json);

                if (data is not null && data.Count > 0)
                    return new Dictionary<string, string>(data, StringComparer.OrdinalIgnoreCase);
            }
            catch
            {
                // Thử path tiếp theo.
            }
        }

        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
    }
}