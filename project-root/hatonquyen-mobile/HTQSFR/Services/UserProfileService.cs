using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using HTQSFR.Utilities;

namespace HTQSFR.Services;

public sealed class UserProfileService
{
    private readonly HttpClient _httpClient;

    public UserProfileService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl)
        };
    }

    public async Task<UpdateProfileResult> UpdateProfileAsync(string token, string fullName, string email)
    {
        var payload = new UpdateProfileRequest
        {
            FullName = fullName,
            Email = email
        };

        var json = JsonSerializer.Serialize(payload);

        using var request = new HttpRequestMessage(HttpMethod.Put, "users/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        using var response = await _httpClient.SendAsync(request);
        var responseContent = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            return new UpdateProfileResult
            {
                Success = false,
                Message = GetLocalizedErrorMessage(response.StatusCode, responseContent)
            };
        }

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var apiResponse = JsonSerializer.Deserialize<UpdateProfileApiResponse>(responseContent, options);

        return new UpdateProfileResult
        {
            Success = true,
            Message = apiResponse?.Message ?? AppText.T("Profile_UpdateSuccess"),
            FullName = apiResponse?.Data?.FullName ?? fullName,
            Email = apiResponse?.Data?.Email ?? email
        };
    }

    private static string GetLocalizedErrorMessage(HttpStatusCode statusCode, string? responseContent)
    {
        return statusCode switch
        {
            HttpStatusCode.NotFound => AppText.T("Profile_UpdateRouteNotFound"),
            HttpStatusCode.Unauthorized => AppText.T("Profile_UpdateUnauthorized"),
            HttpStatusCode.Conflict => AppText.T("Profile_UpdateEmailExists"),
            HttpStatusCode.BadRequest => AppText.T("Profile_UpdateInvalidData"),
            _ => !string.IsNullOrWhiteSpace(responseContent)
                ? responseContent
                : AppText.T("Profile_UpdateFailed")
        };
    }

    private sealed class UpdateProfileRequest
    {
        [JsonPropertyName("fullName")]
        public string FullName { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;
    }

    private sealed class UpdateProfileApiResponse
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("data")]
        public UpdateProfileData? Data { get; set; }
    }

    private sealed class UpdateProfileData
    {
        [JsonPropertyName("fullName")]
        public string? FullName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }
}

public sealed class UpdateProfileResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}