using HTQSFR.Utilities;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;

namespace HTQSFR.Pages;

public partial class RegisterPage : ContentPage
{
    public RegisterPage()
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

        TitleLabel.Text = AppText.T("Register_Title");
        FullNamePlaceholder.Text = AppText.T("Common_FullName");
        EmailPlaceholder.Text = AppText.T("Common_Email");
        PasswordPlaceholder.Text = AppText.T("Common_Password");
        RegisterButton.Text = AppText.T("Register_Button");
        LoginPromptLabel.Text = AppText.T("Register_HaveAccount");
        LoginLinkLabel.Text = AppText.T("Register_LoginLink");
    }

    private async void OnRegisterClicked(object sender, EventArgs e)
    {
        var fullName = FullNameEntry.Text?.Trim() ?? string.Empty;
        var email = EmailEntry.Text?.Trim() ?? string.Empty;
        var password = PasswordEntry.Text?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(fullName) ||
            string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                AppText.T("Register_EnterAllFields"),
                AppText.T("Common_OK"));
            return;
        }

        Preferences.Default.Set("FullName", fullName);

        await DisplayAlert(
            AppText.T("Register_SuccessTitle"),
            AppText.T("Register_SuccessMessage"),
            AppText.T("Common_OK"));

        await Shell.Current.GoToAsync("//login");
    }

    private async void OnLoginTapped(object sender, TappedEventArgs e)
    {
        await Shell.Current.GoToAsync("//login");
    }

    private void OnFullNameBorderTapped(object sender, TappedEventArgs e)
    {
        FullNameEntry.Focus();
    }

    private void OnEmailBorderTapped(object sender, TappedEventArgs e)
    {
        EmailEntry.Focus();
    }

    private void OnPasswordBorderTapped(object sender, TappedEventArgs e)
    {
        PasswordEntry.Focus();
    }

    private void OnFullNameFocused(object sender, FocusEventArgs e)
    {
        FullNamePlaceholder.IsVisible = false;
    }

    private void OnFullNameUnfocused(object sender, FocusEventArgs e)
    {
        FullNamePlaceholder.IsVisible = string.IsNullOrWhiteSpace(FullNameEntry.Text);
    }

    private void OnFullNameTextChanged(object sender, TextChangedEventArgs e)
    {
        FullNamePlaceholder.IsVisible = string.IsNullOrWhiteSpace(e.NewTextValue);
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
        FullNamePlaceholder.IsVisible = string.IsNullOrWhiteSpace(FullNameEntry.Text);
        EmailPlaceholder.IsVisible = string.IsNullOrWhiteSpace(EmailEntry.Text);
        PasswordPlaceholder.IsVisible = string.IsNullOrWhiteSpace(PasswordEntry.Text);
    }
}