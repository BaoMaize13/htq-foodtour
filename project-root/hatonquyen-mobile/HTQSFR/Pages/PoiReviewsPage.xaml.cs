using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;

namespace HTQSFR.Pages;

public partial class PoiReviewsPage : ContentPage
{
    private readonly string _poiId;
    private readonly ReviewService _reviewService = new();
    private bool _hasLoaded;
    private bool _isDisposed;

    public PoiReviewsPage(string poiId, string? poiName = null)
    {
        InitializeComponent();

        _poiId = poiId ?? string.Empty;
        BindingContext = new PoiReviewsPageViewModel(poiName);

        AppText.LanguageChanged += OnAppLanguageChanged;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        FlowDirection = AppText.GetFlowDirection();

        if (BindingContext is PoiReviewsPageViewModel vm)
            vm.ApplyLanguage();

        if (!_hasLoaded)
        {
            _hasLoaded = true;
            await LoadReviewsAsync();
        }
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();
    }

    protected override bool OnBackButtonPressed()
    {
        DisposeEvents();
        return base.OnBackButtonPressed();
    }

    private async void OnAppLanguageChanged(object? sender, EventArgs e)
    {
        await MainThread.InvokeOnMainThreadAsync(() =>
        {
            FlowDirection = AppText.GetFlowDirection();

            if (BindingContext is PoiReviewsPageViewModel vm)
                vm.ApplyLanguage();
        });
    }

    private async void OnBackTapped(object sender, TappedEventArgs e)
    {
        DisposeEvents();

        if (Navigation.NavigationStack.Count > 1)
        {
            await Navigation.PopAsync();
            return;
        }

        await Shell.Current.GoToAsync("..");
    }

    private async void OnRefreshClicked(object sender, EventArgs e)
    {
        await LoadReviewsAsync();
    }

    private async Task LoadReviewsAsync()
    {
        if (BindingContext is not PoiReviewsPageViewModel vm)
            return;

        if (vm.IsLoading)
            return;

        try
        {
            vm.IsLoading = true;

            var result = await _reviewService.GetPoiReviewsAsync(_poiId);

            if (!result.IsSuccess)
            {
                vm.SetReviews(new List<PoiReviewDto>());

                await DisplayAlert(
                    TextOrDefault("Common_Notice", "Notice"),
                    string.IsNullOrWhiteSpace(result.Message)
                        ? TextOrDefault("Review_LoadFailed", "Could not load reviews. Please try again.")
                        : result.Message,
                    TextOrDefault("Common_OK", "OK"));

                return;
            }

            vm.SetReviews(result.Reviews);
        }
        finally
        {
            vm.IsLoading = false;
        }
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private void DisposeEvents()
    {
        if (_isDisposed)
            return;

        AppText.LanguageChanged -= OnAppLanguageChanged;
        _isDisposed = true;
    }
}

public sealed class PoiReviewsPageViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private readonly string _poiName;

    private string _title = string.Empty;
    private string _subtitle = string.Empty;
    private string _refreshText = string.Empty;
    private string _loadingText = string.Empty;
    private string _emptyTitle = string.Empty;
    private string _emptyMessage = string.Empty;
    private bool _isLoading;

    public ObservableCollection<ReviewListItem> Reviews { get; } = new();

    public PoiReviewsPageViewModel(string? poiName)
    {
        _poiName = string.IsNullOrWhiteSpace(poiName)
            ? TextOrDefault("Detail_Reviews", "Reviews")
            : poiName.Trim();

        ApplyLanguage();
    }

    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public string Subtitle
    {
        get => _subtitle;
        set => SetProperty(ref _subtitle, value);
    }

    public string RefreshText
    {
        get => _refreshText;
        set => SetProperty(ref _refreshText, value);
    }

    public string LoadingText
    {
        get => _loadingText;
        set => SetProperty(ref _loadingText, value);
    }

    public string EmptyTitle
    {
        get => _emptyTitle;
        set => SetProperty(ref _emptyTitle, value);
    }

    public string EmptyMessage
    {
        get => _emptyMessage;
        set => SetProperty(ref _emptyMessage, value);
    }

    public bool IsLoading
    {
        get => _isLoading;
        set => SetProperty(ref _isLoading, value);
    }

    public void ApplyLanguage()
    {
        Title = TextOrDefault("Review_AllReviewsTitle", "All reviews");
        Subtitle = FormatText("Review_AllReviewsSubtitle", "User reviews for {0}", _poiName);
        RefreshText = TextOrDefault("Review_Refresh", "Refresh");
        LoadingText = TextOrDefault("Review_Loading", "Loading...");
        EmptyTitle = TextOrDefault("Review_NoReviewsTitle", "No reviews yet");
        EmptyMessage = TextOrDefault("Review_NoReviewsMessage", "Be the first to review this place.");

        foreach (ReviewListItem item in Reviews)
            item.ApplyLanguage();
    }

    public void SetReviews(IEnumerable<PoiReviewDto> reviews)
    {
        Reviews.Clear();

        foreach (PoiReviewDto review in reviews)
            Reviews.Add(ReviewListItem.FromDto(review));
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private static string FormatText(string key, string fallback, params object[] args)
    {
        string template = TextOrDefault(key, fallback);

        try
        {
            return string.Format(template, args);
        }
        catch
        {
            return string.Format(fallback, args);
        }
    }

    private void SetProperty<T>(
        ref T backingStore,
        T value,
        [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return;

        backingStore = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}

public sealed class ReviewListItem : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private readonly DateTimeOffset? _createdAt;
    private int _rating;
    private string _ratingText = string.Empty;
    private string _createdAtText = string.Empty;

    public string UserName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;

    public string RatingText
    {
        get => _ratingText;
        set => SetProperty(ref _ratingText, value);
    }

    public string CreatedAtText
    {
        get => _createdAtText;
        set => SetProperty(ref _createdAtText, value);
    }

    private ReviewListItem(DateTimeOffset? createdAt)
    {
        _createdAt = createdAt;
    }

    public static ReviewListItem FromDto(PoiReviewDto dto)
    {
        var item = new ReviewListItem(dto.CreatedAt)
        {
            UserName = string.IsNullOrWhiteSpace(dto.UserName)
                ? TextOrDefault("Review_AnonymousUser", "User")
                : dto.UserName.Trim(),
            Content = dto.Content?.Trim() ?? string.Empty,
            _rating = dto.Rating
        };

        item.ApplyLanguage();
        return item;
    }

    public void ApplyLanguage()
    {
        RatingText = FormatText("Review_RatingFormat", "{0}/5 stars", _rating);
        CreatedAtText = FormatDate(_createdAt);
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private static string FormatText(string key, string fallback, params object[] args)
    {
        string template = TextOrDefault(key, fallback);

        try
        {
            return string.Format(template, args);
        }
        catch
        {
            return string.Format(fallback, args);
        }
    }

    private static string FormatDate(DateTimeOffset? value)
    {
        if (value is null)
            return TextOrDefault("Review_DateUnknown", "Unknown date");

        CultureInfo culture = GetCulture();
        return value.Value.ToLocalTime().ToString("g", culture);
    }

    private static CultureInfo GetCulture()
    {
        string language = (AppText.CurrentLanguageCode ?? "en").Trim().ToLowerInvariant().Replace("_", "-");

        string cultureName = language switch
        {
            "vi" => "vi-VN",
            "ko" => "ko-KR",
            "ja" => "ja-JP",
            "zh-hans" => "zh-CN",
            "zh-hant" => "zh-TW",
            "es" => "es-ES",
            "de" => "de-DE",
            "fr" => "fr-FR",
            "ru" => "ru-RU",
            _ => "en-US"
        };

        try
        {
            return new CultureInfo(cultureName);
        }
        catch
        {
            return CultureInfo.InvariantCulture;
        }
    }

    private void SetProperty<T>(
        ref T backingStore,
        T value,
        [CallerMemberName] string? propertyName = null)
    {
        if (EqualityComparer<T>.Default.Equals(backingStore, value))
            return;

        backingStore = value;
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
