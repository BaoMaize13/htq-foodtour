using System.ComponentModel;
using System.Runtime.CompilerServices;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;

namespace HTQSFR.PageModels;

public class ProfilePageModel : INotifyPropertyChanged
{
    private string _fullName = string.Empty;
    private string _email = string.Empty;
    private string _avatarUrl = "cat_local.jpg";

    private bool _isDarkMode;
    private bool _isLocationServices;
    private bool _isPushNotifications;

    public event PropertyChangedEventHandler? PropertyChanged;

    public string FullName
    {
        get => _fullName;
        set
        {
            if (_fullName != value)
            {
                _fullName = value;
                OnPropertyChanged();
            }
        }
    }

    public string Email
    {
        get => _email;
        set
        {
            if (_email != value)
            {
                _email = value;
                OnPropertyChanged();
            }
        }
    }

    public string AvatarUrl
    {
        get => _avatarUrl;
        set
        {
            if (_avatarUrl != value)
            {
                _avatarUrl = value;
                OnPropertyChanged();
            }
        }
    }

    public bool IsDarkMode
    {
        get => _isDarkMode;
        set
        {
            if (_isDarkMode != value)
            {
                _isDarkMode = value;
                Preferences.Default.Set("IsDarkMode", value);
                ApplyTheme(value);
                OnPropertyChanged();
            }
        }
    }

    public bool IsLocationServices
    {
        get => _isLocationServices;
        set
        {
            if (_isLocationServices != value)
            {
                _isLocationServices = value;
                Preferences.Default.Set("IsLocationServices", value);
                OnPropertyChanged();
            }
        }
    }

    public bool IsPushNotifications
    {
        get => _isPushNotifications;
        set
        {
            if (_isPushNotifications != value)
            {
                _isPushNotifications = value;
                Preferences.Default.Set("IsPushNotifications", value);
                OnPropertyChanged();
            }
        }
    }

    public ProfilePageModel()
    {
        ReloadUserInfo();

        _isDarkMode = Preferences.Default.Get("IsDarkMode", false);
        _isLocationServices = Preferences.Default.Get("IsLocationServices", true);
        _isPushNotifications = Preferences.Default.Get("IsPushNotifications", true);

        ApplyTheme(_isDarkMode);
    }

    public void ReloadUserInfo()
    {
        FullName = Preferences.Default.Get("FullName", "Guest");
        Email = Preferences.Default.Get("Email", "guest@smartfoodtour.vn");
        AvatarUrl = Preferences.Default.Get("AvatarUrl", "cat_local.jpg");
    }

    private static void ApplyTheme(bool isDarkMode)
    {
        if (Application.Current is null)
            return;

        Application.Current.UserAppTheme = isDarkMode
            ? AppTheme.Dark
            : AppTheme.Light;
    }

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}