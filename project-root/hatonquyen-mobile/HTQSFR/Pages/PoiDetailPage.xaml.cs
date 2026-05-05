using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Globalization;
using System.Runtime.CompilerServices;
using HTQSFR.Models;
using HTQSFR.PageModels;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;

namespace HTQSFR.Pages;

public partial class PoiDetailPage : ContentPage
{
    private readonly PoiService _poiService = new();
    private readonly ReviewService _reviewService = new();
    private readonly PoiAudioPlaybackService _poiAudioPlaybackService =
        ResolveService<PoiAudioPlaybackService>();

    private string _poiId = string.Empty;
    private string _lastLanguageCode = string.Empty;

    private bool _isFavorite;
    private bool _isRefreshing;
    private bool _isFavoriteBusy;
    private bool _isReviewBusy;
    private bool _isSpeaking;
    private bool _isPageEventDisposed;

    private PoiMapItem? _currentPoi;

    public PoiDetailPage()
    {
        InitializeComponent();

        BindingContext = new PoiDetailPageViewModel();

        AppText.LanguageChanged += OnAppLanguageChanged;
    }

    public PoiDetailPage(PoiMapItem poi)
    {
        InitializeComponent();

        _poiId = poi.Id;
        _isFavorite = poi.IsFavorite;
        _currentPoi = poi;

        BindingContext = new PoiDetailPageViewModel(poi);

        UpdateFavoriteUi();

        AppText.LanguageChanged += OnAppLanguageChanged;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        await RefreshLanguageAndPoiAsync(forceReload: false);
    }

    protected override void OnDisappearing()
    {
        base.OnDisappearing();

        _ = StopAllAudioAsync();

        if (BindingContext is PoiDetailPageViewModel vm)
            vm.SetSpeaking(false);

        _isSpeaking = false;
    }

    private async void OnAppLanguageChanged(object? sender, EventArgs e)
    {
        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            await StopAllAudioAsync();

            if (BindingContext is PoiDetailPageViewModel vm)
                vm.SetSpeaking(false);

            _isSpeaking = false;
            _lastLanguageCode = string.Empty;

            await RefreshLanguageAndPoiAsync(forceReload: true);
        });
    }

    private async Task RefreshLanguageAndPoiAsync(bool forceReload)
    {
        if (_isRefreshing)
            return;

        try
        {
            _isRefreshing = true;

            FlowDirection = AppText.GetFlowDirection();

            if (BindingContext is not PoiDetailPageViewModel vm)
                return;

            vm.ApplyLanguage();
            vm.SetFavorite(_isFavorite);

            string currentLanguage = AppText.CurrentLanguageCode;

            if (string.IsNullOrWhiteSpace(_poiId))
                return;

            bool shouldReloadPoi =
                forceReload ||
                _lastLanguageCode != currentLanguage ||
                _currentPoi is null;

            _lastLanguageCode = currentLanguage;

            if (shouldReloadPoi)
            {
                Services.PoiDto? poi = await _poiService.GetPoiByIdWithTokenAsync(_poiId);

                if (poi is null)
                    poi = await _poiService.GetPoiByIdAsync(_poiId);

                if (poi is null)
                    return;

                vm.ApplyPoi(poi);

                _currentPoi = ToPoiMapItem(poi);

                _isFavorite = poi.IsFavorite;
                vm.SetFavorite(_isFavorite);

                UpdateFavoriteUi();
            }

            await vm.LoadMenuItemsAsync(_poiService, _poiId);
        }
        finally
        {
            _isRefreshing = false;
        }
    }

    private async void OnBackTapped(object sender, TappedEventArgs e)
    {
        await StopAllAudioAsync();
        DisposePageEvents();

        if (Navigation.NavigationStack.Count > 1)
        {
            await Navigation.PopAsync();
            return;
        }

        await Shell.Current.GoToAsync("..");
    }

    private async void OnFavoriteTapped(object sender, TappedEventArgs e)
    {
        await ToggleFavoriteAsync();
    }

    private async void OnSaveTapped(object sender, TappedEventArgs e)
    {
        await ToggleFavoriteAsync();
    }

    private async void OnPlayAudioTapped(object sender, TappedEventArgs e)
    {
        if (BindingContext is not PoiDetailPageViewModel vm)
            return;

        if (_isSpeaking)
        {
            await StopAllAudioAsync();

            _isSpeaking = false;
            vm.SetSpeaking(false);
            return;
        }

        try
        {
            _isSpeaking = true;
            vm.SetSpeaking(true);

            bool played = await _poiAudioPlaybackService.PlayPoiAsync(
                _poiId,
                vm.GetSpeechText());

            if (!played)
            {
                await DisplayAlert(
                    AppText.T("Common_Notice"),
                    TextOrDefault("Detail_NoAudioText", "There is no text to read for this place."),
                    AppText.T("Common_OK"));
            }
        }
        finally
        {
            _isSpeaking = false;

            if (BindingContext is PoiDetailPageViewModel finalVm)
                finalVm.SetSpeaking(false);
        }
    }

    private async Task StopAllAudioAsync()
    {
        await _poiAudioPlaybackService.StopAsync();
    }

    private async Task ToggleFavoriteAsync()
    {
        if (_isFavoriteBusy)
            return;

        if (string.IsNullOrWhiteSpace(_poiId))
            return;

        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

        if (!isLoggedIn)
        {
            bool goToLogin = await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Detail_LoginRequiredMessage", "Please login before saving this place."),
                AppText.T("Login_Button"),
                AppText.T("Common_Cancel"));

            if (goToLogin)
            {
                Preferences.Default.Set("IsGuestMode", false);
                await Shell.Current.GoToAsync("//login");
            }

            return;
        }

        bool oldValue = _isFavorite;
        bool newValue = !_isFavorite;

        try
        {
            _isFavoriteBusy = true;

            _isFavorite = newValue;
            UpdateFavoriteUi();

            if (BindingContext is PoiDetailPageViewModel vm)
                vm.SetFavorite(_isFavorite);

            if (_currentPoi is not null)
                _currentPoi.IsFavorite = _isFavorite;

            bool success = await _poiService.SetFavoriteAsync(_poiId, newValue);

            if (!success)
            {
                _isFavorite = oldValue;
                UpdateFavoriteUi();

                if (BindingContext is PoiDetailPageViewModel failedVm)
                    failedVm.SetFavorite(_isFavorite);

                if (_currentPoi is not null)
                    _currentPoi.IsFavorite = _isFavorite;

                await DisplayAlert(
                    AppText.T("Common_Notice"),
                    TextOrDefault("Detail_SaveFailedMessage", "Could not update saved status. Please try again."),
                    AppText.T("Common_OK"));
            }
        }
        finally
        {
            _isFavoriteBusy = false;
        }
    }



    private async void OnSeeAllReviewsTapped(object sender, TappedEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(_poiId))
        {
            await DisplayAlert(
                TextOrDefault("Common_Notice", "Notice"),
                TextOrDefault("Review_InvalidPoi", "Invalid place."),
                TextOrDefault("Common_OK", "OK"));

            return;
        }

        string poiName = _currentPoi?.Name ?? string.Empty;

        if (string.IsNullOrWhiteSpace(poiName) && BindingContext is PoiDetailPageViewModel vm)
            poiName = vm.Name;

        await Navigation.PushAsync(new PoiReviewsPage(_poiId, poiName));
    }

    private async void OnSubmitReviewClicked(object sender, EventArgs e)
    {
        await SubmitReviewAsync();
    }

    private async Task SubmitReviewAsync()
    {
        if (_isReviewBusy)
            return;

        if (string.IsNullOrWhiteSpace(_poiId))
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Review_InvalidPoi", "Invalid place."),
                AppText.T("Common_OK"));

            return;
        }

        bool isGuestMode = Preferences.Default.Get("IsGuestMode", false);
        bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

        if (isGuestMode || !isLoggedIn)
        {
            bool goToLogin = await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Review_LoginRequired", "Please login to write a review."),
                AppText.T("Login_Button"),
                AppText.T("Common_Cancel"));

            if (goToLogin)
            {
                Preferences.Default.Set("IsGuestMode", false);
                await Shell.Current.GoToAsync("//login");
            }

            return;
        }

        string ratingText = ReviewRatingEntry.Text?.Trim() ?? string.Empty;
        string reviewContent = ReviewCommentEditor.Text?.Trim() ?? string.Empty;

        if (!int.TryParse(ratingText, out int rating) || rating < 1 || rating > 5)
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Review_InvalidRating", "Please choose a rating from 1 to 5."),
                AppText.T("Common_OK"));

            return;
        }

        if (reviewContent.Length < 3)
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Review_ContentRequired", "Please enter your review."),
                AppText.T("Common_OK"));

            return;
        }

        try
        {
            _isReviewBusy = true;

            var result = await _reviewService.CreateReviewAsync(_poiId, rating, reviewContent);

            if (!result.IsSuccess)
            {
                bool shouldLogin = result.RequiresLogin && await DisplayAlert(
                    AppText.T("Common_Notice"),
                    result.Message,
                    AppText.T("Login_Button"),
                    AppText.T("Common_Cancel"));

                if (shouldLogin)
                {
                    Preferences.Default.Set("IsGuestMode", false);
                    await Shell.Current.GoToAsync("//login");
                }
                else if (!result.RequiresLogin)
                {
                    await DisplayAlert(
                        AppText.T("Common_Notice"),
                        result.Message,
                        AppText.T("Common_OK"));
                }

                return;
            }

            ReviewRatingEntry.Text = string.Empty;
            ReviewCommentEditor.Text = string.Empty;

            await DisplayAlert(
                AppText.T("Common_Notice"),
                result.Message,
                AppText.T("Common_OK"));

            _lastLanguageCode = string.Empty;
            await RefreshLanguageAndPoiAsync(forceReload: true);
        }
        finally
        {
            _isReviewBusy = false;
        }
    }

    private async void OnMapTapped(object sender, TappedEventArgs e)
    {
        if (_currentPoi is null ||
            _currentPoi.Latitude == 0 ||
            _currentPoi.Longitude == 0)
        {
            await DisplayAlert(
                AppText.T("Common_Notice"),
                TextOrDefault("Detail_LocationUnavailable", "Location is not available for this place."),
                AppText.T("Common_OK"));

            return;
        }

        await Navigation.PushAsync(new FullMapPage(_currentPoi));
    }

    private void DisposePageEvents()
    {
        if (_isPageEventDisposed)
            return;

        AppText.LanguageChanged -= OnAppLanguageChanged;
        _isPageEventDisposed = true;
    }

    private void UpdateFavoriteUi()
    {
        FavoriteIcon.Source = ImageSource.FromFile(
            _isFavorite ? "ic_like.png" : "ic_unlike.png");
    }

    private static PoiMapItem ToPoiMapItem(Services.PoiDto poi)
    {
        string categorySlug = poi.Category?.Slug ?? string.Empty;

        string categoryName = string.IsNullOrWhiteSpace(poi.Category?.Name)
            ? poi.BadgeText
            : poi.Category.Name;

        string imageUrl = GetBestImageUrl(poi);

        return new PoiMapItem
        {
            Id = poi.Id,
            Name = poi.Name,

            Address = string.IsNullOrWhiteSpace(poi.Address)
                ? AppText.T("Search_Address_HTQ_D11")
                : poi.Address,

            Latitude = poi.Latitude,
            Longitude = poi.Longitude,

            RatingText = string.IsNullOrWhiteSpace(poi.RatingText)
                ? "0.0"
                : poi.RatingText,

            ImageUrl = string.IsNullOrWhiteSpace(imageUrl)
                ? "poi_placeholder.png"
                : imageUrl,

            Images = poi.Images ?? new List<string>(),

            ShortDescription = poi.ShortDescription,
            FullDescription = poi.FullDescription,

            Category = categoryName,
            CategorySlug = categorySlug,
            BadgeText = string.IsNullOrWhiteSpace(poi.BadgeText)
                ? categoryName
                : poi.BadgeText,

            TimeText = poi.TimeText,
            AverageRating = poi.AverageRating,
            TotalReviews = poi.TotalReviews,
            IsFavorite = poi.IsFavorite,
            AudioUrl = poi.AudioUrl,
            InfoTags = poi.InfoTags ?? new List<string>()
        };
    }

    private static string GetBestImageUrl(Services.PoiDto poi)
    {
        if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
            return poi.ImageUrl;

        if (poi.Images is not null && poi.Images.Count > 0)
            return poi.Images.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x)) ?? string.Empty;

        return string.Empty;
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private static T ResolveService<T>() where T : class, new()
    {
        return Application.Current?.Handler?.MauiContext?.Services.GetService<T>()
               ?? new T();
    }
}

public class PoiDetailPageViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    private string _coverImage = string.Empty;
    private string _name = string.Empty;
    private string _ratingText = string.Empty;
    private string _category = string.Empty;
    private string _address = string.Empty;
    private string _description = string.Empty;
    private string _reviewUser = string.Empty;
    private string _reviewText = string.Empty;

    private int _totalReviews;
    private bool _isFavorite;
    private bool _isSpeaking;

    private string _playAudioText = string.Empty;
    private string _saveText = string.Empty;
    private string _mapText = string.Empty;
    private string _aboutTitle = string.Empty;
    private string _featuredMenuTitle = string.Empty;
    private string _reviewsTitle = string.Empty;
    private string _seeAllText = string.Empty;
    private string _reviewFormTitle = string.Empty;
    private string _reviewRatingPlaceholder = string.Empty;
    private string _reviewCommentPlaceholder = string.Empty;
    private string _submitReviewText = string.Empty;

    public string CoverImage
    {
        get => string.IsNullOrWhiteSpace(_coverImage)
            ? "poi_placeholder.png"
            : _coverImage;
        set => SetProperty(ref _coverImage, value);
    }

    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    public string RatingText
    {
        get => string.IsNullOrWhiteSpace(_ratingText)
            ? "0.0"
            : _ratingText;
        set => SetProperty(ref _ratingText, value);
    }

    public string Category
    {
        get => _category;
        set => SetProperty(ref _category, value);
    }

    public string Address
    {
        get => _address;
        set => SetProperty(ref _address, value);
    }

    public string Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string ReviewUser
    {
        get => _reviewUser;
        set => SetProperty(ref _reviewUser, value);
    }

    public string ReviewText
    {
        get => _reviewText;
        set => SetProperty(ref _reviewText, value);
    }

    public string PlayAudioText
    {
        get => _playAudioText;
        set => SetProperty(ref _playAudioText, value);
    }

    public string SaveText
    {
        get => _saveText;
        set => SetProperty(ref _saveText, value);
    }

    public string MapText
    {
        get => _mapText;
        set => SetProperty(ref _mapText, value);
    }

    public string AboutTitle
    {
        get => _aboutTitle;
        set => SetProperty(ref _aboutTitle, value);
    }

    public string FeaturedMenuTitle
    {
        get => _featuredMenuTitle;
        set => SetProperty(ref _featuredMenuTitle, value);
    }

    public string ReviewsTitle
    {
        get => _reviewsTitle;
        set => SetProperty(ref _reviewsTitle, value);
    }

    public string SeeAllText
    {
        get => _seeAllText;
        set => SetProperty(ref _seeAllText, value);
    }

    public string ReviewFormTitle
    {
        get => _reviewFormTitle;
        set => SetProperty(ref _reviewFormTitle, value);
    }

    public string ReviewRatingPlaceholder
    {
        get => _reviewRatingPlaceholder;
        set => SetProperty(ref _reviewRatingPlaceholder, value);
    }

    public string ReviewCommentPlaceholder
    {
        get => _reviewCommentPlaceholder;
        set => SetProperty(ref _reviewCommentPlaceholder, value);
    }

    public string SubmitReviewText
    {
        get => _submitReviewText;
        set => SetProperty(ref _submitReviewText, value);
    }

    public ObservableCollection<MenuPreviewItem> MenuItems { get; } = new();

    public PoiDetailPageViewModel()
    {
        ApplyLanguage();
    }

    public PoiDetailPageViewModel(PoiMapItem poi)
    {
        _isFavorite = poi.IsFavorite;

        ApplyLanguage();
        ApplyPoi(poi);
        SetFavorite(poi.IsFavorite);
    }

    public void ApplyLanguage()
    {
        PlayAudioText = _isSpeaking
            ? GetStopAudioText()
            : TextOrDefault("Detail_PlayAudio", "Play Audio");

        MapText = TextOrDefault("Detail_Map", "Map");
        AboutTitle = TextOrDefault("Detail_About", "About");
        FeaturedMenuTitle = TextOrDefault("Detail_FeaturedMenu", "Featured Menu");
        ReviewsTitle = TextOrDefault("Detail_Reviews", "Reviews");
        SeeAllText = TextOrDefault("Common_SeeAll", "See all");
        ReviewFormTitle = TextOrDefault("Review_FormTitle", "Write a review");
        ReviewRatingPlaceholder = TextOrDefault("Review_RatingPlaceholder", "Rating 1-5");
        ReviewCommentPlaceholder = TextOrDefault("Review_CommentPlaceholder", "Share your experience...");
        SubmitReviewText = TextOrDefault("Review_Submit", "Submit review");

        RefreshSaveText();
        RefreshReviewText();
    }

    public void SetFavorite(bool value)
    {
        _isFavorite = value;
        RefreshSaveText();
    }

    public void SetSpeaking(bool value)
    {
        _isSpeaking = value;

        PlayAudioText = _isSpeaking
            ? GetStopAudioText()
            : TextOrDefault("Detail_PlayAudio", "Play Audio");
    }

    public string GetSpeechText(string? backendSpeechText = null)
    {
        List<string> parts = new();

        if (!string.IsNullOrWhiteSpace(backendSpeechText))
        {
            parts.Add(backendSpeechText.Trim());
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(Name))
                parts.Add(Name.Trim());

            if (!string.IsNullOrWhiteSpace(Description))
                parts.Add(Description.Trim());
        }

        string menuSpeech = BuildFeaturedMenuSpeech();

        if (!string.IsNullOrWhiteSpace(menuSpeech))
            parts.Add(menuSpeech);

        return string.Join(". ", parts.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
    }

    private string BuildFeaturedMenuSpeech()
    {
        if (MenuItems.Count == 0)
            return string.Empty;

        string title = TextOrDefault("Detail_FeaturedMenu", "Featured Menu");

        var menuTexts = MenuItems
            .Take(5)
            .Where(x => !string.IsNullOrWhiteSpace(x.Name))
            .Select(x => x.Name.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        if (menuTexts.Count == 0)
            return string.Empty;

        return $"{title}: {string.Join("; ", menuTexts)}";
    }

    public void ApplyPoi(PoiMapItem poi)
    {
        CoverImage = poi.CoverImage;

        Name = poi.Name;
        RatingText = poi.RatingText;

        Category = GetLocalizedCategoryName(
            poi.CategorySlug,
            poi.Category,
            poi.BadgeText);

        Address = string.IsNullOrWhiteSpace(poi.Address)
            ? AppText.T("Search_Address_HTQ_D11")
            : poi.Address;

        Description = poi.Description;

        _totalReviews = poi.TotalReviews;
        RefreshReviewText();

        MenuItems.Clear();
    }

    public void ApplyPoi(Services.PoiDto poi)
    {
        CoverImage = GetBestImageUrl(poi);
        Name = poi.Name;
        RatingText = poi.RatingText;

        Category = GetLocalizedCategoryName(
            poi.Category?.Slug,
            poi.Category?.Name,
            poi.BadgeText);

        Address = string.IsNullOrWhiteSpace(poi.Address)
            ? AppText.T("Search_Address_HTQ_D11")
            : poi.Address;

        Description = poi.Description;

        _totalReviews = poi.TotalReviews;
        RefreshReviewText();

        MenuItems.Clear();
    }

    public async Task LoadMenuItemsAsync(PoiService poiService, string poiId)
    {
        MenuItems.Clear();

        if (string.IsNullOrWhiteSpace(poiId))
            return;

        var menuItems = await poiService.GetPoiMenuAsync(poiId);

        foreach (var item in menuItems.Take(5))
        {
            MenuItems.Add(new MenuPreviewItem
            {
                Name = item.Name,
                Price = string.IsNullOrWhiteSpace(item.PriceText)
                    ? FormatPrice(item.Price)
                    : item.PriceText,
                Image = string.IsNullOrWhiteSpace(item.ImageUrl)
                    ? "poi_placeholder.png"
                    : item.ImageUrl
            });
        }
    }

    private void RefreshSaveText()
    {
        if (_isFavorite)
        {
            SaveText = TextOrDefault("Detail_Saved", AppText.T("Detail_Save"));
            return;
        }

        SaveText = TextOrDefault("Detail_Save", "Save");
    }

    private void RefreshReviewText()
    {
        if (_totalReviews <= 0)
        {
            ReviewUser = TextOrDefault("Detail_NoReviewsTitle", "No reviews yet");
            ReviewText = TextOrDefault("Detail_NoReviewsMessage", "This place has no reviews yet.");
            return;
        }

        ReviewUser = TextOrDefault("Detail_Reviews", "Reviews");

        string template = TextOrDefault(
            "Detail_ReviewSummary",
            "{0} user reviews.");

        try
        {
            ReviewText = string.Format(template, _totalReviews);
        }
        catch
        {
            ReviewText = $"{_totalReviews} user reviews.";
        }
    }

    private static string GetStopAudioText()
    {
        string value = AppText.T("Detail_StopAudio");

        if (!string.IsNullOrWhiteSpace(value) && value != "Detail_StopAudio")
            return value;

        string lang = AppText.CurrentLanguageCode?.Trim().ToLowerInvariant() ?? "en";

        return lang switch
        {
            "vi" => "Dừng",
            "ko" => "중지",
            "ja" => "停止",
            "zh-hans" => "停止",
            "zh-hant" => "停止",
            "fr" => "Arrêter",
            "de" => "Stopp",
            "es" => "Detener",
            "ru" => "Стоп",
            _ => "Stop"
        };
    }

    private static string GetBestImageUrl(Services.PoiDto poi)
    {
        if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
            return poi.ImageUrl;

        if (poi.Images is not null && poi.Images.Count > 0)
            return poi.Images.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))
                   ?? "poi_placeholder.png";

        return "poi_placeholder.png";
    }

    private static string GetLocalizedCategoryName(
        string? slug,
        string? backendCategoryName,
        string? backendBadgeText)
    {
        string normalizedSlug = (slug ?? string.Empty).Trim().ToLowerInvariant();

        return normalizedSlug switch
        {
            "dimsum" => AppText.T("Main_Category_Dimsum"),

            "mi-hu-tieu" => AppText.T("Main_Category_Noodles"),
            "mi" => AppText.T("Main_Category_Noodles"),
            "noodles" => AppText.T("Main_Category_Noodles"),

            "lau" => AppText.T("Main_Category_Hotpot"),
            "hotpot" => AppText.T("Main_Category_Hotpot"),

            "nuoc-uong" => AppText.T("Main_Category_Drink"),
            "tra" => AppText.T("Main_Category_Drink"),
            "drink" => AppText.T("Main_Category_Drink"),
            "drinks" => AppText.T("Main_Category_Drink"),

            "mon-hoa" => AppText.T("Main_Category_ChineseCuisine"),
            "nha-hang" => AppText.T("Main_Category_ChineseCuisine"),
            "restaurant" => AppText.T("Main_Category_ChineseCuisine"),
            "chinese-cuisine" => AppText.T("Main_Category_ChineseCuisine"),

            _ => !string.IsNullOrWhiteSpace(backendCategoryName)
                ? backendCategoryName
                : backendBadgeText ?? string.Empty
        };
    }

    private static string FormatPrice(decimal price)
    {
        if (price <= 0)
            return "0 ₫";

        CultureInfo culture = new("vi-VN");

        return string.Format(culture, "{0:N0} ₫", price);
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
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

public class MenuPreviewItem
{
    public string Name { get; set; } = string.Empty;
    public string Price { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
}