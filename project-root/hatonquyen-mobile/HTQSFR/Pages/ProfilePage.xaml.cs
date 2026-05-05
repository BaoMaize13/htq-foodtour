using HTQSFR.PageModels;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace HTQSFR.Pages;

public partial class ProfilePage : ContentPage
{
    private readonly ProfilePageModel _model;
    private bool _isGuestMode;

    private readonly List<LanguageOption> _languages = new()
    {
        new LanguageOption("en", "English"),
        new LanguageOption("vi", "Vietnamese"),
        new LanguageOption("ja", "Japanese"),
        new LanguageOption("ko", "Korean"),
        new LanguageOption("zh-Hans", "Chinese (Simplified)"),
        new LanguageOption("zh-Hant", "Chinese (Traditional)"),
        new LanguageOption("fr", "French"),
        new LanguageOption("es", "Spanish"),
        new LanguageOption("de", "German"),
        new LanguageOption("ru", "Russian"),
    };

    public ProfilePage()
    {
        InitializeComponent();

        _model = new ProfilePageModel();
        BindingContext = _model;

        AppText.LanguageChanged += OnAppLanguageChanged;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();
        _isGuestMode = !isLoggedIn || Preferences.Default.Get("IsGuestMode", false);

        if (_isGuestMode)
        {
            FullNameValueLabel.Text = TextOrDefault("Profile_GuestName", "Guest");
            EmailValueLabel.Text = TextOrDefault("Profile_LoginToUnlock", "Login to unlock this feature");

            AuthButtonsGrid.IsVisible = false;
            GuestLoginCard.IsVisible = true;
            LogoutRow.IsVisible = false;
            EditProfileOverlay.IsVisible = false;
        }
        else
        {
            Preferences.Default.Set("IsGuestMode", false);

            _model.ReloadUserInfo();

            FullNameValueLabel.Text = Preferences.Default.Get("FullName", _model.FullName);
            EmailValueLabel.Text = Preferences.Default.Get("Email", _model.Email);

            AuthButtonsGrid.IsVisible = true;
            GuestLoginCard.IsVisible = false;
            LogoutRow.IsVisible = true;
        }

        ApplyLanguage();
    }

    private void OnAppLanguageChanged(object? sender, EventArgs e)
    {
        MainThread.BeginInvokeOnMainThread(ApplyLanguage);
    }

    private void ApplyLanguage()
    {
        FlowDirection = AppText.GetFlowDirection();

        string currentCode = AppText.CurrentLanguageCode;

        var currentLanguage = _languages.FirstOrDefault(x => x.Code == currentCode)
                              ?? _languages.First(x => x.Code == "en");

        ProfileTitleLabel.Text = AppText.T("Profile_Title");
        EditLabel.Text = AppText.T("Profile_Edit");
        ShareProfileLabel.Text = AppText.T("Profile_ShareProfile");
        DarkModeLabel.Text = AppText.T("Profile_DarkMode");
        LocationServicesLabel.Text = AppText.T("Profile_LocationServices");
        PushNotificationsLabel.Text = AppText.T("Profile_PushNotifications");
        LanguageLabel.Text = AppText.T("Profile_Language");
        CurrentLanguageLabel.Text = currentLanguage.DisplayName;
        PrivacyLabel.Text = AppText.T("Profile_Privacy");
        HelpLabel.Text = AppText.T("Profile_Help");
        LogoutLabel.Text = AppText.T("Profile_Logout");

        GuestLoginLabel.Text = AppText.T("Login_Button");
        GuestMessageLabel.Text = TextOrDefault("Profile_LoginToUnlock", "Login to unlock this feature");

        if (_isGuestMode)
        {
            FullNameValueLabel.Text = TextOrDefault("Profile_GuestName", "Guest");
            EmailValueLabel.Text = TextOrDefault("Profile_LoginToUnlock", "Login to unlock this feature");
        }

        EditProfileTitleLabel.Text = AppText.T("Profile_Edit");
        EditFullNameLabel.Text = AppText.T("Common_FullName");
        EditFullNameEntry.Placeholder = AppText.T("Common_FullName");
        EditEmailLabel.Text = AppText.T("Common_Email");
        EditEmailEntry.Placeholder = AppText.T("Common_Email");
        EditCancelLabel.Text = AppText.T("Common_Cancel");
        EditSaveLabel.Text = AppText.T("Common_OK");
    }

    private async void OnGuestLoginTapped(object sender, TappedEventArgs e)
    {
        Preferences.Default.Set("IsGuestMode", false);
        await Shell.Current.GoToAsync("//login");
    }

    private async Task<bool> EnsureLoggedInForActionAsync()
    {
        if (!_isGuestMode)
            return true;

        bool goToLogin = await DisplayAlert(
            AppText.T("Common_Notice"),
            TextOrDefault("Profile_LoginRequiredAction", "Please login to use this feature."),
            AppText.T("Login_Button"),
            AppText.T("Common_Cancel"));

        if (goToLogin)
        {
            Preferences.Default.Set("IsGuestMode", false);
            await Shell.Current.GoToAsync("//login");
        }

        return false;
    }

    private async void OnEditProfileTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForActionAsync())
            return;

        string currentName = Preferences.Default.Get("FullName", _model.FullName);
        string currentEmail = Preferences.Default.Get("Email", _model.Email);

        EditFullNameEntry.Text = currentName;
        EditEmailEntry.Text = currentEmail;
        EditProfileOverlay.IsVisible = true;
    }

    private void OnCloseEditProfilePopupTapped(object sender, TappedEventArgs e)
    {
        EditProfileOverlay.IsVisible = false;
    }

    private void OnEditOverlayBackgroundTapped(object sender, TappedEventArgs e)
    {
        EditProfileOverlay.IsVisible = false;
    }

    private async void OnSaveEditProfileTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForActionAsync())
            return;

        string newName = EditFullNameEntry.Text?.Trim() ?? string.Empty;
        string newEmail = EditEmailEntry.Text?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(newName))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_FullNameRequired"),
                AppText.T("Common_OK"));
            return;
        }

        if (string.IsNullOrWhiteSpace(newEmail) || !IsValidEmail(newEmail))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_EmailInvalid"),
                AppText.T("Common_OK"));
            return;
        }

        string? token = await AuthSessionService.GetAccessTokenAsync();

        if (string.IsNullOrWhiteSpace(token))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_SessionMissing"),
                AppText.T("Common_OK"));
            return;
        }

        try
        {
            IsEnabled = false;

            var profileService = new UserProfileService();
            var result = await profileService.UpdateProfileAsync(token, newName, newEmail);

            if (!result.Success)
            {
                await DisplayAlert(
                    AppText.T("Common_Notice"),
                    AppText.T("Profile_UpdateFailed"),
                    AppText.T("Common_OK"));
                return;
            }

            Preferences.Default.Set("FullName", result.FullName);
            Preferences.Default.Set("Email", result.Email);

            FullNameValueLabel.Text = result.FullName;
            EmailValueLabel.Text = result.Email;

            EditProfileOverlay.IsVisible = false;

            _model.ReloadUserInfo();
            ApplyLanguage();

            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_UpdateSuccess"),
                AppText.T("Common_OK"));
        }
        catch
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_UpdateError"),
                AppText.T("Common_OK"));
        }
        finally
        {
            IsEnabled = true;
        }
    }

    private async void OnShareProfileTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForActionAsync())
            return;

        string fullName = Preferences.Default.Get("FullName", _model.FullName);
        string email = Preferences.Default.Get("Email", _model.Email);

        string shareText =
            $"{AppText.T("Profile_ShareTextTitle")}\n" +
            $"{AppText.T("Common_FullName")}: {fullName}\n" +
            $"{AppText.T("Common_Email")}: {email}\n" +
            $"{AppText.T("Profile_ShareTextApp")}: Smart Food Tour";

        await Share.Default.RequestAsync(new ShareTextRequest
        {
            Title = AppText.T("Profile_ShareProfile"),
            Text = shareText
        });
    }

    private async void OnPrivacyTapped(object sender, TappedEventArgs e)
    {
        await DisplayAlert(
            AppText.T("Profile_Privacy"),
            AppText.T("Profile_PrivacyMessage"),
            AppText.T("Common_OK"));
    }

    private async void OnHelpTapped(object sender, TappedEventArgs e)
    {
        string guideText = AppText.T("Profile_HelpGuide");
        string contactText = AppText.T("Profile_HelpContact");
        string aboutText = AppText.T("Profile_HelpAbout");

        string action = await DisplayActionSheet(
            AppText.T("Profile_Help"),
            AppText.T("Common_Cancel"),
            null,
            guideText,
            contactText,
            aboutText);

        if (string.IsNullOrWhiteSpace(action) || action == AppText.T("Common_Cancel"))
            return;

        if (action == guideText)
        {
            await DisplayAlert(
                AppText.T("Profile_Help"),
                AppText.T("Profile_HelpGuideMessage"),
                AppText.T("Common_OK"));
            return;
        }

        if (action == contactText)
        {
            try
            {
                await Launcher.Default.OpenAsync("mailto:support@smartfoodtour.vn?subject=Support");
            }
            catch
            {
                await DisplayAlert(
                    AppText.T("Profile_Help"),
                    AppText.T("Profile_EmailAppUnavailable"),
                    AppText.T("Common_OK"));
            }

            return;
        }

        if (action == aboutText)
        {
            await DisplayAlert(
                AppText.T("Profile_Help"),
                AppText.T("Profile_AboutMessage"),
                AppText.T("Common_OK"));
        }
    }

    private async void OnChangeLanguageTapped(object sender, TappedEventArgs e)
    {
        string cancelText = AppText.T("Common_Cancel");

        string selected = await DisplayActionSheet(
            AppText.T("Profile_ChooseLanguage"),
            cancelText,
            null,
            _languages.Select(x => x.DisplayName).ToArray());

        if (string.IsNullOrWhiteSpace(selected) || selected == cancelText)
            return;

        var language = _languages.FirstOrDefault(x => x.DisplayName == selected);

        if (language is null)
            return;

        try
        {
            IsEnabled = false;

            await AppText.SetLanguageAsync(language.Code);

            if (Shell.Current is AppShell shell)
                shell.ApplyLanguage();

            ApplyLanguage();

            await MainThread.InvokeOnMainThreadAsync(() =>
            {
                InvalidateMeasure();
                ForceLayout();
            });

            if (!_isGuestMode)
            {
                string? token = await AuthSessionService.GetAccessTokenAsync();

                if (!string.IsNullOrWhiteSpace(token))
                {
                    var preferenceService = new UserPreferenceService();
                    await preferenceService.UpdatePreferredLanguageAsync(token, language.Code);
                }
            }

            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Profile_LanguageChanged"),
                AppText.T("Common_OK"));
        }
        finally
        {
            IsEnabled = true;
        }
    }

    private async void OnLogoutTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForActionAsync())
            return;

        bool confirm = await DisplayAlert(
            AppText.T("Common_Notice"),
            AppText.T("Profile_LogoutConfirm"),
            AppText.T("Common_OK"),
            AppText.T("Common_Cancel"));

        if (!confirm)
            return;

        Preferences.Default.Set("IsGuestMode", true);
        AuthSessionService.Logout();

        await Shell.Current.GoToAsync("//login");
    }

    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        return Regex.IsMatch(
            email,
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
            RegexOptions.IgnoreCase);
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);
        return string.IsNullOrWhiteSpace(value) || value == key ? fallback : value;
    }

    private sealed class LanguageOption
    {
        public string Code { get; }
        public string DisplayName { get; }

        public LanguageOption(string code, string displayName)
        {
            Code = code;
            DisplayName = displayName;
        }
    }
}