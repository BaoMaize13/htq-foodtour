using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;

namespace HTQSFR.Pages;

public partial class LoginPage : ContentPage
{
    private readonly AuthService _authService = new();
    private bool _isLoggingIn;

    public LoginPage()
    {
        InitializeComponent();
        UpdatePlaceholders();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        ApplyLanguage();
        UpdatePlaceholders();
    }

    private void ApplyLanguage()
    {
        FlowDirection = AppText.GetFlowDirection();

        TitleLabel.Text = AppText.T("Login_Title");
        EmailPlaceholder.Text = AppText.T("Common_Email");
        PasswordPlaceholder.Text = AppText.T("Common_Password");
        ForgotPasswordLabel.Text = AppText.T("Login_ForgotPassword");

        LoginButton.Text = _isLoggingIn
            ? AppText.T("Common_Loading")
            : AppText.T("Login_Button");

        GuestButton.Text = AppText.T("Login_ExploreNow");
        GuestHintLabel.Text = AppText.T("Login_NoLoginRequired");

        RegisterPromptLabel.Text = AppText.T("Login_NoAccount");
        RegisterLinkLabel.Text = AppText.T("Login_RegisterLink");
    }

    private async void OnLoginClicked(object sender, EventArgs e)
    {
        if (_isLoggingIn)
            return;

        string email = EmailEntry.Text?.Trim() ?? string.Empty;
        string password = PasswordEntry.Text?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Login_EnterEmailPassword"),
                AppText.T("Common_OK"));

            return;
        }

        try
        {
            _isLoggingIn = true;
            LoginButton.IsEnabled = false;
            GuestButton.IsEnabled = false;
            LoginButton.Text = AppText.T("Common_Loading");

            var result = await _authService.LoginAsync(email, password);

            if (!result.IsSuccess)
            {
                await DisplayAlert(
                    AppText.T("Common_Notice"),
                    result.ErrorMessage,
                    AppText.T("Common_OK"));

                return;
            }

            Preferences.Default.Set("IsGuestMode", false);

            await AuthSessionService.SaveSessionAsync(result);

            await PresenceService.StartPresenceAsync();
            await PresenceService.IdentifyCurrentSessionAsync();

            await DisplayAlert(
                AppText.T("Login_SuccessTitle"),
                AppText.T("Login_SuccessMessage"),
                AppText.T("Common_OK"));

            await Shell.Current.GoToAsync("//main/home");
        }
        finally
        {
            _isLoggingIn = false;
            LoginButton.IsEnabled = true;
            GuestButton.IsEnabled = true;
            LoginButton.Text = AppText.T("Login_Button");
        }
    }

    private async void OnContinueAsGuestClicked(object sender, EventArgs e)
    {
        if (_isLoggingIn)
            return;

        Preferences.Default.Set("IsGuestMode", true);

        await PresenceService.StartPresenceAsync();

        await Shell.Current.GoToAsync("//main/home");
    }

    private async void OnForgotPasswordTapped(object sender, TappedEventArgs e)
    {
        await DisplayAlert(
            AppText.T("Login_ForgotPasswordTitle"),
            AppText.T("Login_ForgotPasswordMessage"),
            AppText.T("Common_OK"));
    }

    private async void OnRegisterTapped(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync("//register");
    }

    private void OnEmailBorderTapped(object sender, TappedEventArgs e)
    {
        EmailEntry.Focus();
    }

    private void OnPasswordBorderTapped(object sender, TappedEventArgs e)
    {
        PasswordEntry.Focus();
    }

    private void OnEmailFocused(object sender, FocusEventArgs e)
    {
        EmailPlaceholder.IsVisible = false;
    }

    private void OnEmailUnfocused(object sender, FocusEventArgs e)
    {
        EmailPlaceholder.IsVisible = string.IsNullOrWhiteSpace(EmailEntry.Text);
    }

    private void OnEmailTextChanged(object sender, TextChangedEventArgs e)
    {
        EmailPlaceholder.IsVisible = string.IsNullOrWhiteSpace(e.NewTextValue);
    }

    private void OnPasswordFocused(object sender, FocusEventArgs e)
    {
        PasswordPlaceholder.IsVisible = false;
    }

    private void OnPasswordUnfocused(object sender, FocusEventArgs e)
    {
        PasswordPlaceholder.IsVisible = string.IsNullOrWhiteSpace(PasswordEntry.Text);
    }

    private void OnPasswordTextChanged(object sender, TextChangedEventArgs e)
    {
        PasswordPlaceholder.IsVisible = string.IsNullOrWhiteSpace(e.NewTextValue);
    }

    private void UpdatePlaceholders()
    {
        EmailPlaceholder.IsVisible = string.IsNullOrWhiteSpace(EmailEntry.Text);
        PasswordPlaceholder.IsVisible = string.IsNullOrWhiteSpace(PasswordEntry.Text);
    }
}