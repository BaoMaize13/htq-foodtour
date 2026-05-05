using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HTQSFR.Utilities;

namespace HTQSFR.Services;

public class UserPreferenceService
{
    private readonly HttpClient _httpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public UserPreferenceService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl)
        };
    }

    public async Task<string?> GetPreferredLanguageAsync(string token)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "users/me/preferences");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                return null;

            string json = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(json))
                return null;

            return ParsePreferredLanguage(json);
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> UpdatePreferredLanguageAsync(string token, string languageCode)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(languageCode))
            return false;

        object[] payloads =
        {
            new { preferredLanguage = languageCode },
            new { language = languageCode },
            new { selectedLanguage = languageCode }
        };

        (HttpMethod Method, string Url)[] endpoints =
        {
            (HttpMethod.Patch, "users/me/preferences/language"),
            (HttpMethod.Patch, "users/me/preferences"),
            (HttpMethod.Put, "users/me/preferences")
        };

        foreach (var endpoint in endpoints)
        {
            foreach (object payload in payloads)
            {
                if (await SendPreferenceRequestAsync(endpoint.Method, endpoint.Url, token, payload))
                    return true;
            }
        }

        return false;
    }

    private async Task<bool> SendPreferenceRequestAsync(
        HttpMethod method,
        string url,
        string token,
        object payload)
    {
        try
        {
            var request = new HttpRequestMessage(method, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = JsonContent.Create(payload);

            var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static string? ParsePreferredLanguage(string json)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            string? direct = FindLanguageValue(root);
            if (!string.IsNullOrWhiteSpace(direct))
                return direct;

            var data = JsonSerializer.Deserialize<UserPreferenceResponse>(
                json,
                JsonOptions);

            return data?.PreferredLanguage ?? data?.Language ?? data?.SelectedLanguage;
        }
        catch
        {
            return null;
        }
    }

    private static string? FindLanguageValue(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        string[] languageKeys =
        {
            "preferredLanguage",
            "language",
            "selectedLanguage",
            "currentLanguage"
        };

        foreach (string key in languageKeys)
        {
            if (element.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String)
                return value.GetString();
        }

        string[] objectKeys =
        {
            "data",
            "user",
            "profile",
            "preferences",
            "settings"
        };

        foreach (string key in objectKeys)
        {
            if (element.TryGetProperty(key, out var child) && child.ValueKind == JsonValueKind.Object)
            {
                string? nested = FindLanguageValue(child);
                if (!string.IsNullOrWhiteSpace(nested))
                    return nested;
            }
        }

        return null;
    }

    private class UserPreferenceResponse
    {
        [JsonPropertyName("preferredLanguage")]
        public string? PreferredLanguage { get; set; }

        [JsonPropertyName("language")]
        public string? Language { get; set; }

        [JsonPropertyName("selectedLanguage")]
        public string? SelectedLanguage { get; set; }
    }
}