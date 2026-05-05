using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using HTQSFR.Utilities;

namespace HTQSFR.Services;

public sealed class PoiService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PoiService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl),
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    public async Task<List<PoiDto>> GetPoisAsync()
    {
        string lang = AppText.CurrentLanguageCode;
        string url = $"pois?lang={Uri.EscapeDataString(lang)}";

        // POI list là public data, nên lấy không token trước để tránh token cũ làm API trả 401.
        var publicResult = await GetPoiListFlexibleAsync(url, token: null);

        if (publicResult.Count > 0)
        {
            Debug.WriteLine($"POI DEBUG: public pois count = {publicResult.Count}");
            return publicResult;
        }

        // Nếu public không ra data thì thử lại với token, phòng backend yêu cầu login.
        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (!string.IsNullOrWhiteSpace(token))
        {
            var authResult = await GetPoiListFlexibleAsync(url, token);
            Debug.WriteLine($"POI DEBUG: auth pois count = {authResult.Count}");
            return authResult;
        }

        Debug.WriteLine("POI DEBUG: no pois loaded");
        return new List<PoiDto>();
    }

    public async Task<PoiDto?> GetPoiByIdAsync(string poiId)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return null;

        string lang = AppText.CurrentLanguageCode;
        string url = $"pois/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}";

        var wrapper = await GetAsync<PoiSingleResponseDto>(url, token: null);

        if (wrapper?.Data is not null)
            return wrapper.Data;

        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (string.IsNullOrWhiteSpace(token))
            return null;

        wrapper = await GetAsync<PoiSingleResponseDto>(url, token);
        return wrapper?.Data;
    }

    public async Task<PoiDto?> GetPoiByIdWithTokenAsync(string poiId)
    {
        string? token = await AuthSessionService.GetAccessTokenAsync();
        return await GetPoiByIdWithTokenAsync(poiId, token);
    }

    public async Task<PoiDto?> GetPoiByIdWithTokenAsync(string poiId, string? token)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return null;

        string lang = AppText.CurrentLanguageCode;
        string url = $"pois/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}";

        var wrapper = await GetAsync<PoiSingleResponseDto>(url, token);
        return wrapper?.Data;
    }

    public async Task<List<PoiMenuItemDto>> GetPoiMenuAsync(string poiId)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return new List<PoiMenuItemDto>();

        string lang = AppText.CurrentLanguageCode;

        string[] urls =
        {
        $"pois/{Uri.EscapeDataString(poiId)}/menu?lang={Uri.EscapeDataString(lang)}",
        $"menu-items/by-poi/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}",
        $"menu/by-poi/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}"
    };

        // Featured menu là public data, lấy không token trước.
        // Tránh token guest/token cũ làm API trả 401/403 rồi app tưởng không có menu.
        foreach (string url in urls)
        {
            var publicWrapper = await GetAsync<PoiMenuListResponseDto>(url, token: null);

            if (publicWrapper?.Data is { Count: > 0 })
            {
                Debug.WriteLine($"POI DEBUG: public menu count = {publicWrapper.Data.Count}");
                return publicWrapper.Data;
            }
        }

        // Nếu public không ra thì mới thử lại bằng token.
        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (!string.IsNullOrWhiteSpace(token))
        {
            foreach (string url in urls)
            {
                var authWrapper = await GetAsync<PoiMenuListResponseDto>(url, token);

                if (authWrapper?.Data is { Count: > 0 })
                {
                    Debug.WriteLine($"POI DEBUG: auth menu count = {authWrapper.Data.Count}");
                    return authWrapper.Data;
                }
            }
        }

        Debug.WriteLine("POI DEBUG: no menu items loaded");
        return new List<PoiMenuItemDto>();
    }

    public async Task<PoiAudioDto?> GetPoiAudioAsync(string poiId)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return null;

        string lang = AppText.CurrentLanguageCode;

        string[] urls =
        {
            $"pois/{Uri.EscapeDataString(poiId)}/audio?lang={Uri.EscapeDataString(lang)}",
            $"narrations/poi-audio/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}",
            $"audio/poi/{Uri.EscapeDataString(poiId)}?lang={Uri.EscapeDataString(lang)}"
        };

        foreach (string url in urls)
        {
            var wrapper = await GetAsync<PoiAudioResponseDto>(url, includeAuthIfAvailable: true);

            if (wrapper?.Data is not null)
                return wrapper.Data;
        }

        return null;
    }

    public async Task<List<PoiDto>> GetFavoritePoisAsync()
    {
        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (string.IsNullOrWhiteSpace(token))
            return new List<PoiDto>();

        return await GetFavoritePoisAsync(token);
    }

    public async Task<List<PoiDto>> GetFavoritePoisAsync(string token)
    {
        string lang = AppText.CurrentLanguageCode;

        string[] urls =
        {
            $"pois/favorites?lang={Uri.EscapeDataString(lang)}",
            $"users/me/favorites?lang={Uri.EscapeDataString(lang)}",
            $"favorites/pois?lang={Uri.EscapeDataString(lang)}"
        };

        foreach (string url in urls)
        {
            var wrapper = await GetAsync<PoiListResponseDto>(url, token);

            if (wrapper?.Data is not null)
                return wrapper.Data;
        }

        return new List<PoiDto>();
    }

    public async Task<bool> SetFavoriteAsync(string poiId, bool isFavorite)
    {
        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (string.IsNullOrWhiteSpace(token))
            return false;

        return await SetFavoriteAsync(poiId, isFavorite, token);
    }

    public async Task<bool> SetFavoriteAsync(string poiId, bool isFavorite, string token)
    {
        if (string.IsNullOrWhiteSpace(poiId) || string.IsNullOrWhiteSpace(token))
            return false;

        string[] urls =
        {
            $"pois/{Uri.EscapeDataString(poiId)}/favorite",
            $"users/me/favorites/{Uri.EscapeDataString(poiId)}",
            $"favorites/pois/{Uri.EscapeDataString(poiId)}"
        };

        foreach (string url in urls)
        {
            bool ok = isFavorite
                ? await SendWithoutBodyAsync(HttpMethod.Post, url, token)
                : await SendWithoutBodyAsync(HttpMethod.Delete, url, token);

            if (ok)
                return true;
        }

        return false;
    }

    private async Task<List<PoiDto>> GetPoiListFlexibleAsync(string url, string? token)
    {
        string? json = await GetRawJsonAsync(url, token);

        if (string.IsNullOrWhiteSpace(json))
            return new List<PoiDto>();

        try
        {
            using JsonDocument doc = JsonDocument.Parse(json);
            JsonElement root = doc.RootElement;

            // Case 1: backend trả thẳng array:
            // [ { ... }, { ... } ]
            if (root.ValueKind == JsonValueKind.Array)
                return DeserializePoiArray(root);

            // Case 2: backend trả:
            // { data: [ ... ] }
            if (TryGetProperty(root, "data", out JsonElement data))
            {
                if (data.ValueKind == JsonValueKind.Array)
                    return DeserializePoiArray(data);

                // Case 3: backend trả:
                // { data: { items: [ ... ] } }
                // { data: { pois: [ ... ] } }
                // { data: { results: [ ... ] } }
                if (data.ValueKind == JsonValueKind.Object)
                {
                    if (TryReadArrayFromObject(data, out List<PoiDto> nestedList))
                        return nestedList;
                }
            }

            // Case 4: backend trả:
            // { items: [ ... ] }
            // { pois: [ ... ] }
            // { results: [ ... ] }
            if (root.ValueKind == JsonValueKind.Object)
            {
                if (TryReadArrayFromObject(root, out List<PoiDto> rootList))
                    return rootList;
            }

            Debug.WriteLine("POI DEBUG: unsupported JSON shape");
            Debug.WriteLine(json);

            return new List<PoiDto>();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"POI DEBUG: parse error = {ex.Message}");
            Debug.WriteLine(json);
            return new List<PoiDto>();
        }
    }

    private static bool TryReadArrayFromObject(JsonElement obj, out List<PoiDto> pois)
    {
        pois = new List<PoiDto>();

        string[] keys =
        {
            "items",
            "pois",
            "results",
            "docs",
            "records"
        };

        foreach (string key in keys)
        {
            if (!TryGetProperty(obj, key, out JsonElement value))
                continue;

            if (value.ValueKind != JsonValueKind.Array)
                continue;

            pois = DeserializePoiArray(value);
            return true;
        }

        return false;
    }

    private static List<PoiDto> DeserializePoiArray(JsonElement arrayElement)
    {
        try
        {
            return JsonSerializer.Deserialize<List<PoiDto>>(
                arrayElement.GetRawText(),
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<PoiDto>();
        }
        catch
        {
            return new List<PoiDto>();
        }
    }

    private static bool TryGetProperty(JsonElement element, string name, out JsonElement value)
    {
        value = default;

        if (element.ValueKind != JsonValueKind.Object)
            return false;

        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase))
            {
                value = property.Value;
                return true;
            }
        }

        return false;
    }

    private async Task<T?> GetAsync<T>(string url, bool includeAuthIfAvailable)
    {
        string? token = includeAuthIfAvailable
            ? await AuthSessionService.GetAccessTokenAsync()
            : null;

        return await GetAsync<T>(url, token);
    }

    private async Task<T?> GetAsync<T>(string url, string? token)
    {
        string? json = await GetRawJsonAsync(url, token);

        if (string.IsNullOrWhiteSpace(json))
            return default;

        try
        {
            return JsonSerializer.Deserialize<T>(json, _jsonOptions);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"POI DEBUG: deserialize error {typeof(T).Name} = {ex.Message}");
            Debug.WriteLine(json);
            return default;
        }
    }

    private async Task<string?> GetRawJsonAsync(string url, string? token)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, url);

            if (!string.IsNullOrWhiteSpace(token))
            {
                request.Headers.Authorization =
                    new AuthenticationHeaderValue("Bearer", token);
            }

            using var response = await _httpClient.SendAsync(request);
            string json = await response.Content.ReadAsStringAsync();

            Debug.WriteLine($"POI DEBUG: GET {_httpClient.BaseAddress}{url}");
            Debug.WriteLine($"POI DEBUG: status {(int)response.StatusCode} {response.StatusCode}");
            Debug.WriteLine($"POI DEBUG: body {TrimForLog(json)}");

            if (response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                return null;

            if (!response.IsSuccessStatusCode || string.IsNullOrWhiteSpace(json))
                return null;

            return json;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"POI DEBUG: request error = {ex.Message}");
            return null;
        }
    }

    private async Task<bool> SendWithoutBodyAsync(HttpMethod method, string url, string token)
    {
        try
        {
            using var request = new HttpRequestMessage(method, url);

            request.Headers.Authorization =
                new AuthenticationHeaderValue("Bearer", token);

            using var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static string TrimForLog(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        const int maxLength = 1200;

        return value.Length <= maxLength
            ? value
            : value[..maxLength] + "...";
    }
}