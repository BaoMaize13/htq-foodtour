using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HTQSFR.Utilities;

namespace HTQSFR.Services;

public sealed class ReviewService
{
    private const string CreateReviewEndpoint = "reviews";

    private readonly HttpClient _httpClient;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public ReviewService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl),
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    public async Task<CreateReviewResult> CreateReviewAsync(string poiId, int rating, string content)
    {
        string token = await AuthSessionService.GetAccessTokenAsync() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(token))
        {
            return CreateReviewResult.Fail(
                TextOrDefault("Review_LoginRequired", "Please login to write a review."),
                requiresLogin: true);
        }

        if (string.IsNullOrWhiteSpace(poiId))
            return CreateReviewResult.Fail(TextOrDefault("Review_InvalidPoi", "Invalid place."));

        if (rating < 1 || rating > 5)
            return CreateReviewResult.Fail(TextOrDefault("Review_InvalidRating", "Please choose a rating from 1 to 5."));

        string normalizedContent = content?.Trim() ?? string.Empty;

        if (normalizedContent.Length < 3)
            return CreateReviewResult.Fail(TextOrDefault("Review_ContentRequired", "Please enter your review."));

        try
        {
            var payload = new CreateReviewRequest
            {
                PoiId = poiId,
                Rating = rating,
                Content = normalizedContent
            };

            string json = JsonSerializer.Serialize(payload, JsonOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, CreateReviewEndpoint);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request);
            string responseContent = await response.Content.ReadAsStringAsync();

            Debug.WriteLine($"REVIEW DEBUG: POST {_httpClient.BaseAddress}{CreateReviewEndpoint}");
            Debug.WriteLine($"REVIEW DEBUG: status {(int)response.StatusCode} {response.StatusCode}");
            Debug.WriteLine($"REVIEW DEBUG: body {TrimForLog(responseContent)}");

            if (response.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden)
            {
                await AuthSessionService.ClearSessionAsync();

                return CreateReviewResult.Fail(
                    TextOrDefault("Review_LoginExpired", "Your login session has expired. Please log in again."),
                    requiresLogin: true);
            }

            if (!response.IsSuccessStatusCode)
            {
                return CreateReviewResult.Fail(
                    ExtractMessage(responseContent, TextOrDefault("Review_SubmitFailed", "Could not submit review. Please try again.")));
            }

            return CreateReviewResult.Success(
                ExtractMessage(responseContent, TextOrDefault("Review_SubmitSuccess", "Your review has been submitted.")));
        }
        catch (Exception ex)
        {
            return CreateReviewResult.Fail(
                $"{TextOrDefault("Review_SubmitFailed", "Could not submit review. Please try again.")}\n\n" +
                $"BaseUrl: {ApiConfig.BaseUrl}\n" +
                $"Endpoint: {CreateReviewEndpoint}\n" +
                $"Error: {ex.Message}");
        }
    }

    public async Task<PoiReviewsResult> GetPoiReviewsAsync(string poiId)
    {
        if (string.IsNullOrWhiteSpace(poiId))
        {
            return PoiReviewsResult.Fail(
                TextOrDefault("Review_InvalidPoi", "Invalid place."));
        }

        string lang = AppText.CurrentLanguageCode;
        string encodedPoiId = Uri.EscapeDataString(poiId);
        string encodedLang = Uri.EscapeDataString(lang);

        string[] urls =
        {
            $"pois/{encodedPoiId}/reviews?lang={encodedLang}",
            $"reviews/poi/{encodedPoiId}?lang={encodedLang}",
            $"reviews/by-poi/{encodedPoiId}?lang={encodedLang}"
        };

        foreach (string url in urls)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                using var response = await _httpClient.SendAsync(request);
                string json = await response.Content.ReadAsStringAsync();

                Debug.WriteLine($"REVIEW DEBUG: GET {_httpClient.BaseAddress}{url}");
                Debug.WriteLine($"REVIEW DEBUG: status {(int)response.StatusCode} {response.StatusCode}");
                Debug.WriteLine($"REVIEW DEBUG: body {TrimForLog(json)}");

                if (!response.IsSuccessStatusCode || string.IsNullOrWhiteSpace(json))
                    continue;

                var reviews = ParseReviewList(json);
                var meta = ParseReviewMeta(json);

                return PoiReviewsResult.Success(reviews, meta);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"REVIEW DEBUG: list request error = {ex.Message}");
            }
        }

        return PoiReviewsResult.Fail(
            TextOrDefault("Review_LoadFailed", "Could not load reviews. Please try again."));
    }

    private static List<PoiReviewDto> ParseReviewList(string json)
    {
        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;

            if (root.ValueKind == JsonValueKind.Array)
                return DeserializeReviewArray(root);

            if (TryGetProperty(root, "data", out JsonElement data))
            {
                if (data.ValueKind == JsonValueKind.Array)
                    return DeserializeReviewArray(data);

                if (data.ValueKind == JsonValueKind.Object && TryReadArrayFromObject(data, out List<PoiReviewDto> nested))
                    return nested;
            }

            if (root.ValueKind == JsonValueKind.Object && TryReadArrayFromObject(root, out List<PoiReviewDto> rootList))
                return rootList;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"REVIEW DEBUG: parse list error = {ex.Message}");
            Debug.WriteLine(json);
        }

        return new List<PoiReviewDto>();
    }

    private static PoiReviewsMeta ParseReviewMeta(string json)
    {
        PoiReviewsMeta meta = new();

        try
        {
            using JsonDocument document = JsonDocument.Parse(json);
            JsonElement root = document.RootElement;

            JsonElement metaElement = default;

            if (TryGetProperty(root, "meta", out JsonElement rootMeta))
                metaElement = rootMeta;
            else if (TryGetProperty(root, "data", out JsonElement data) &&
                     data.ValueKind == JsonValueKind.Object &&
                     TryGetProperty(data, "meta", out JsonElement nestedMeta))
                metaElement = nestedMeta;

            if (metaElement.ValueKind != JsonValueKind.Object)
                return meta;

            meta.AverageRating = GetDecimal(metaElement, "averageRating") ?? 0;
            meta.TotalReviews = GetInt(metaElement, "totalReviews") ?? 0;
        }
        catch
        {
            return meta;
        }

        return meta;
    }

    private static bool TryReadArrayFromObject(JsonElement obj, out List<PoiReviewDto> reviews)
    {
        reviews = new List<PoiReviewDto>();

        string[] keys = { "items", "reviews", "results", "docs", "records" };

        foreach (string key in keys)
        {
            if (!TryGetProperty(obj, key, out JsonElement value) || value.ValueKind != JsonValueKind.Array)
                continue;

            reviews = DeserializeReviewArray(value);
            return true;
        }

        return false;
    }

    private static List<PoiReviewDto> DeserializeReviewArray(JsonElement arrayElement)
    {
        List<PoiReviewDto> reviews = new();

        foreach (JsonElement item in arrayElement.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
                continue;

            string userName =
                GetString(item, "userName") ??
                GetString(item, "fullName") ??
                GetNestedString(item, "user", "fullName") ??
                GetNestedString(item, "user", "name") ??
                GetNestedString(item, "user", "email") ??
                TextOrDefault("Review_AnonymousUser", "User");

            reviews.Add(new PoiReviewDto
            {
                Id = GetString(item, "id") ?? GetString(item, "_id") ?? string.Empty,
                PoiId = GetString(item, "poiId") ?? GetNestedString(item, "poi", "id") ?? string.Empty,
                UserId = GetString(item, "userId") ?? GetNestedString(item, "user", "id") ?? string.Empty,
                UserName = userName,
                Rating = GetInt(item, "rating") ?? 0,
                Content = GetString(item, "content") ?? GetString(item, "comment") ?? GetString(item, "text") ?? string.Empty,
                Status = GetString(item, "status") ?? string.Empty,
                CreatedAt = GetDateTime(item, "createdAt"),
                UpdatedAt = GetDateTime(item, "updatedAt")
            });
        }

        return reviews;
    }

    private static string ExtractMessage(string json, string fallback)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(json))
                return fallback;

            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            string? message = GetString(root, "message") ?? GetString(root, "error");
            return string.IsNullOrWhiteSpace(message) ? fallback : message;
        }
        catch
        {
            return fallback;
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

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (!TryGetProperty(element, propertyName, out var value))
            return null;

        if (value.ValueKind == JsonValueKind.String)
            return value.GetString();

        if (value.ValueKind is JsonValueKind.Number or JsonValueKind.True or JsonValueKind.False)
            return value.ToString();

        return null;
    }

    private static string? GetNestedString(JsonElement element, string objectName, string propertyName)
    {
        if (!TryGetProperty(element, objectName, out JsonElement nested) || nested.ValueKind != JsonValueKind.Object)
            return null;

        return GetString(nested, propertyName);
    }

    private static int? GetInt(JsonElement element, string propertyName)
    {
        if (!TryGetProperty(element, propertyName, out JsonElement value))
            return null;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out int intValue))
            return intValue;

        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out int parsed))
            return parsed;

        return null;
    }

    private static decimal? GetDecimal(JsonElement element, string propertyName)
    {
        if (!TryGetProperty(element, propertyName, out JsonElement value))
            return null;

        if (value.ValueKind == JsonValueKind.Number && value.TryGetDecimal(out decimal decimalValue))
            return decimalValue;

        if (value.ValueKind == JsonValueKind.String && decimal.TryParse(value.GetString(), out decimal parsed))
            return parsed;

        return null;
    }

    private static DateTimeOffset? GetDateTime(JsonElement element, string propertyName)
    {
        string? value = GetString(element, propertyName);

        if (string.IsNullOrWhiteSpace(value))
            return null;

        if (DateTimeOffset.TryParse(value, out DateTimeOffset parsed))
            return parsed;

        return null;
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
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

public sealed class CreateReviewRequest
{
    [JsonPropertyName("poiId")]
    public string PoiId { get; set; } = string.Empty;

    [JsonPropertyName("rating")]
    public int Rating { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

public sealed class CreateReviewResult
{
    public bool IsSuccess { get; init; }
    public bool RequiresLogin { get; init; }
    public string Message { get; init; } = string.Empty;

    public static CreateReviewResult Success(string message)
    {
        return new CreateReviewResult
        {
            IsSuccess = true,
            Message = message
        };
    }

    public static CreateReviewResult Fail(string message, bool requiresLogin = false)
    {
        return new CreateReviewResult
        {
            IsSuccess = false,
            RequiresLogin = requiresLogin,
            Message = message
        };
    }
}

public sealed class PoiReviewsResult
{
    public bool IsSuccess { get; init; }
    public string Message { get; init; } = string.Empty;
    public List<PoiReviewDto> Reviews { get; init; } = new();
    public PoiReviewsMeta Meta { get; init; } = new();

    public static PoiReviewsResult Success(List<PoiReviewDto> reviews, PoiReviewsMeta? meta = null)
    {
        return new PoiReviewsResult
        {
            IsSuccess = true,
            Reviews = reviews,
            Meta = meta ?? new PoiReviewsMeta()
        };
    }

    public static PoiReviewsResult Fail(string message)
    {
        return new PoiReviewsResult
        {
            IsSuccess = false,
            Message = message
        };
    }
}

public sealed class PoiReviewsMeta
{
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
}

public sealed class PoiReviewDto
{
    public string Id { get; set; } = string.Empty;
    public string PoiId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTimeOffset? CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
