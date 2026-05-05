using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using HTQSFR.Utilities;

namespace HTQSFR.Services;

public class AuthService
{
    private readonly HttpClient _httpClient;

    // Nếu backend là: /api/users/login thì giữ users/login
    // Nếu backend là: /api/auth/login thì đổi thành auth/login
    private const string LoginEndpoint = "users/login";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AuthService()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(ApiConfig.BaseUrl),
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    public async Task<AuthLoginResult> LoginAsync(string email, string password)
    {
        try
        {
            var payload = new LoginRequest
            {
                Email = email,
                Password = password
            };

            var response = await _httpClient.PostAsJsonAsync(
                LoginEndpoint,
                payload,
                JsonOptions);

            string json = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                string message = ExtractMessage(json);

                return AuthLoginResult.Fail(
                    string.IsNullOrWhiteSpace(message)
                        ? AppText.T("Login_InvalidCredentials")
                        : message);
            }

            var result = ParseLoginResponse(json);

            if (string.IsNullOrWhiteSpace(result.AccessToken))
                return AuthLoginResult.Fail(AppText.T("Login_TokenMissing"));

            if (string.IsNullOrWhiteSpace(result.User.Id))
                result.User.Id = result.User.MongoId;

            if (string.IsNullOrWhiteSpace(result.User.FullName))
                result.User.FullName = result.User.Name;

            if (string.IsNullOrWhiteSpace(result.User.FullName))
                result.User.FullName = result.User.Email;

            if (string.IsNullOrWhiteSpace(result.User.Role))
                result.User.Role = result.User.RoleCode;

            return result;
        }
        catch (Exception ex)
        {
            return AuthLoginResult.Fail(
                $"{AppText.T("Login_BackendUnavailable")}\n\n" +
                $"BaseUrl: {ApiConfig.BaseUrl}\n" +
                $"Endpoint: {LoginEndpoint}\n" +
                $"Full URL: {ApiConfig.BaseUrl}{LoginEndpoint}\n" +
                $"Error: {ex.Message}");
        }
    }

    private static AuthLoginResult ParseLoginResponse(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        var data = root;

        if (root.ValueKind == JsonValueKind.Object &&
            root.TryGetProperty("data", out var dataElement) &&
            dataElement.ValueKind == JsonValueKind.Object)
        {
            data = dataElement;
        }

        string accessToken =
            GetString(data, "accessToken")
            ?? GetString(data, "token")
            ?? GetString(data, "authToken")
            ?? string.Empty;

        string refreshToken =
            GetString(data, "refreshToken")
            ?? string.Empty;

        AuthUserDto user = new();

        if (data.TryGetProperty("user", out var userElement) &&
            userElement.ValueKind == JsonValueKind.Object)
        {
            user = JsonSerializer.Deserialize<AuthUserDto>(
                userElement.GetRawText(),
                JsonOptions) ?? new AuthUserDto();

            user.Id = GetString(userElement, "id")
                      ?? GetString(userElement, "_id")
                      ?? user.Id;

            user.MongoId = GetString(userElement, "_id")
                           ?? user.MongoId;

            user.FullName = GetString(userElement, "fullName")
                            ?? GetString(userElement, "name")
                            ?? user.FullName;

            user.Name = GetString(userElement, "name")
                        ?? user.Name;

            user.Email = GetString(userElement, "email")
                         ?? user.Email;

            user.Role = GetString(userElement, "role")
                        ?? GetString(userElement, "roleCode")
                        ?? user.Role;

            user.RoleCode = GetString(userElement, "roleCode")
                            ?? user.RoleCode;
        }
        else
        {
            user.Id = GetString(data, "userId")
                      ?? GetString(data, "id")
                      ?? GetString(data, "_id")
                      ?? string.Empty;

            user.MongoId = GetString(data, "_id") ?? string.Empty;
            user.FullName = GetString(data, "fullName")
                            ?? GetString(data, "name")
                            ?? string.Empty;
            user.Name = GetString(data, "name") ?? string.Empty;
            user.Email = GetString(data, "email") ?? string.Empty;
            user.Role = GetString(data, "role")
                        ?? GetString(data, "roleCode")
                        ?? string.Empty;
            user.RoleCode = GetString(data, "roleCode") ?? string.Empty;
        }

        return AuthLoginResult.Success(accessToken, refreshToken, user);
    }

    private static string ExtractMessage(string json)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(json))
                return string.Empty;

            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;

            string? code =
                GetString(root, "code")
                ?? GetString(root, "errorCode");

            if (!string.IsNullOrWhiteSpace(code))
            {
                string mappedKey = $"Error_{code}";
                string mappedText = AppText.T(mappedKey);

                if (mappedText != mappedKey)
                    return mappedText;
            }

            return GetString(root, "message")
                   ?? GetString(root, "error")
                   ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (element.ValueKind != JsonValueKind.Object)
            return null;

        if (!element.TryGetProperty(propertyName, out var value))
            return null;

        if (value.ValueKind == JsonValueKind.String)
            return value.GetString();

        return value.ToString();
    }
}

public class LoginRequest
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;
}

public class AuthLoginResult
{
    public bool IsSuccess { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;

    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;

    public AuthUserDto User { get; set; } = new();

    public static AuthLoginResult Success(
        string accessToken,
        string refreshToken,
        AuthUserDto user)
    {
        return new AuthLoginResult
        {
            IsSuccess = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = user
        };
    }

    public static AuthLoginResult Fail(string message)
    {
        return new AuthLoginResult
        {
            IsSuccess = false,
            ErrorMessage = message
        };
    }
}

public class AuthUserDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("_id")]
    public string MongoId { get; set; } = string.Empty;

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("roleCode")]
    public string RoleCode { get; set; } = string.Empty;
}