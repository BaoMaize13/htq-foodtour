using Microsoft.Maui.Storage;

namespace HTQSFR.Services;

public static class AuthSessionService
{
    private const string AccessTokenKey = "auth_access_token";
    private const string RefreshTokenKey = "auth_refresh_token";

    private const string FullNameKey = "FullName";
    private const string EmailKey = "Email";
    private const string UserIdKey = "UserId";
    private const string RoleKey = "Role";
    private const string GuestModeKey = "IsGuestMode";

    public static async Task SaveSessionAsync(AuthLoginResult result)
    {
        if (!string.IsNullOrWhiteSpace(result.AccessToken))
            await SecureStorage.SetAsync(AccessTokenKey, result.AccessToken);

        if (!string.IsNullOrWhiteSpace(result.RefreshToken))
            await SecureStorage.SetAsync(RefreshTokenKey, result.RefreshToken);

        Preferences.Default.Set(UserIdKey, result.User.Id ?? string.Empty);
        Preferences.Default.Set(FullNameKey, result.User.FullName ?? string.Empty);
        Preferences.Default.Set(EmailKey, result.User.Email ?? string.Empty);
        Preferences.Default.Set(RoleKey, result.User.Role ?? string.Empty);
        Preferences.Default.Set(GuestModeKey, false);
    }

    public static async Task SaveTokenAsync(string token)
    {
        if (!string.IsNullOrWhiteSpace(token))
            await SecureStorage.SetAsync(AccessTokenKey, token);
    }

    public static async Task<string?> GetAccessTokenAsync()
    {
        try
        {
            return await SecureStorage.GetAsync(AccessTokenKey);
        }
        catch
        {
            return null;
        }
    }

    public static async Task<string?> GetTokenAsync()
    {
        return await GetAccessTokenAsync();
    }

    public static async Task<string?> GetRefreshTokenAsync()
    {
        try
        {
            return await SecureStorage.GetAsync(RefreshTokenKey);
        }
        catch
        {
            return null;
        }
    }

    public static async Task<bool> IsLoggedInAsync()
    {
        var token = await GetAccessTokenAsync();
        return !string.IsNullOrWhiteSpace(token);
    }

    public static bool IsGuestMode()
    {
        return Preferences.Default.Get(GuestModeKey, false);
    }

    public static async Task<bool> CanWriteReviewAsync()
    {
        return !IsGuestMode() && await IsLoggedInAsync();
    }

    public static string GetFullName()
    {
        return Preferences.Default.Get(FullNameKey, string.Empty);
    }

    public static string GetEmail()
    {
        return Preferences.Default.Get(EmailKey, string.Empty);
    }

    public static string GetUserId()
    {
        return Preferences.Default.Get(UserIdKey, string.Empty);
    }

    public static string GetRole()
    {
        return Preferences.Default.Get(RoleKey, string.Empty);
    }

    public static void Logout()
    {
        SecureStorage.Remove(AccessTokenKey);
        SecureStorage.Remove(RefreshTokenKey);

        Preferences.Default.Remove(UserIdKey);
        Preferences.Default.Remove(FullNameKey);
        Preferences.Default.Remove(EmailKey);
        Preferences.Default.Remove(RoleKey);
        Preferences.Default.Set(GuestModeKey, false);
    }

    public static Task ClearSessionAsync()
    {
        SecureStorage.Default.Remove("auth_access_token");
        SecureStorage.Default.Remove("auth_refresh_token");

        Preferences.Default.Remove("FullName");
        Preferences.Default.Remove("Email");
        Preferences.Default.Remove("UserId");
        Preferences.Default.Remove("Role");
        Preferences.Default.Set("IsGuestMode", false);

        return Task.CompletedTask;
    }
}