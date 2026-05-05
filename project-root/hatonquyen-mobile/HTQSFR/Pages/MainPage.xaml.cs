using HTQSFR.Models;
using HTQSFR.PageModels;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;

namespace HTQSFR.Pages;

public partial class MainPage : ContentPage
{
    private const string PendingSearchTypeFilterKey = "PendingSearchTypeFilter";

    private readonly MainPageModel _model;

    public MainPage()
    {
        InitializeComponent();

        _model = new MainPageModel();
        BindingContext = _model;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        FlowDirection = AppText.GetFlowDirection();

        await _model.LoadDataAsync();
    }

    private async void OnPoiTapped(object sender, TappedEventArgs e)
    {
        if (sender is not BindableObject bindable)
            return;

        if (bindable.BindingContext is not PoiMapItem poi)
            return;

        await Navigation.PushAsync(new PoiDetailPage(poi));
    }

    private async void OnCategoryTapped(object sender, TappedEventArgs e)
    {
        if (sender is not BindableObject bindable)
            return;

        if (bindable.BindingContext is not HomeCategoryItem category)
            return;

        if (string.IsNullOrWhiteSpace(category.Key))
            return;

        Preferences.Default.Set(PendingSearchTypeFilterKey, category.Key);

        await Shell.Current.GoToAsync("//search");
    }

    private async void OnSeeAllTapped(object sender, TappedEventArgs e)
    {
        Preferences.Default.Remove(PendingSearchTypeFilterKey);
        await Shell.Current.GoToAsync("//search");
    }
}