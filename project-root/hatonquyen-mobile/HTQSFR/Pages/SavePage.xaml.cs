using HTQSFR.Models;
using HTQSFR.PageModels;
using HTQSFR.Services;
using HTQSFR.Utilities;

namespace HTQSFR.Pages;

public partial class SavedPage : ContentPage
{
    private readonly SavedPageModel _model;
    private bool _hasShownGuestMessage;

    public SavedPage()
    {
        InitializeComponent();

        _model = new SavedPageModel();
        BindingContext = _model;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        FlowDirection = AppText.GetFlowDirection();

        _model.ApplyLanguage();

        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

        if (!isLoggedIn)
        {
            _model.SavedItems.Clear();
            _hasShownGuestMessage = false;
            await _model.LoadDataAsync();
            return;
        }

        _hasShownGuestMessage = false;
        await _model.LoadDataAsync();
    }

    private async void OnSavedItemTapped(object sender, TappedEventArgs e)
    {
        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

        if (!isLoggedIn)
        {
            await ShowLoginRequiredAsync();
            return;
        }

        if (sender is not BindableObject bindable)
            return;

        if (bindable.BindingContext is not PoiMapItem poi)
            return;

        await Navigation.PushAsync(new PoiDetailPage(poi));
    }

    private async void OnTimeFilterTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForSavedAsync())
            return;

        _model.SelectFilter("time");
    }

    private async void OnNameFilterTapped(object sender, TappedEventArgs e)
    {
        if (!await EnsureLoggedInForSavedAsync())
            return;

        _model.SelectFilter("name");
    }

    private async Task<bool> EnsureLoggedInForSavedAsync()
    {
        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

        if (isLoggedIn)
            return true;

        await ShowLoginRequiredAsync();
        return false;
    }

    private async Task ShowLoginRequiredAsync()
    {
        if (_hasShownGuestMessage)
            return;

        _hasShownGuestMessage = true;

        bool goToLogin = await DisplayAlert(
            AppText.T("Common_Notice"),
            TextOrDefault("Saved_LoginRequired", "Please login to view saved places."),
            AppText.T("Login_Button"),
            AppText.T("Common_Cancel"));

        _hasShownGuestMessage = false;

        if (goToLogin)
            await Shell.Current.GoToAsync("//login");
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }
}