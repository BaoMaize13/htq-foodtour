using CommunityToolkit.Mvvm.ComponentModel;
using HTQSFR.Models;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;
using System.Collections.ObjectModel;
using System.Linq;

namespace HTQSFR.PageModels;

public partial class MainPageModel : ObservableObject
{
    private readonly PoiService _poiService = new();
    private readonly PoiCacheService _poiCacheService = new();

    private bool _hasUserLocation;
    private double _userLatitude;
    private double _userLongitude;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private string greetingText = string.Empty;

    [ObservableProperty]
    private string homeTitleText = string.Empty;

    [ObservableProperty]
    private string categoriesTitle = string.Empty;

    [ObservableProperty]
    private string popularDishTitle = string.Empty;

    [ObservableProperty]
    private string popularDrinkTitle = string.Empty;

    [ObservableProperty]
    private string seeAllText = string.Empty;

    public ObservableCollection<HomeCategoryItem> Categories { get; } = new();

    public ObservableCollection<PoiMapItem> PopularDishes { get; } = new();

    public ObservableCollection<PoiMapItem> PopularDrinks { get; } = new();

    public MainPageModel()
    {
        ApplyLanguage();
    }

    public void ApplyLanguage()
    {
        string userDisplayName = GetUserDisplayName();

        GreetingText = string.IsNullOrWhiteSpace(userDisplayName)
            ? AppText.T("Main_Greeting")
            : $"{AppText.T("Main_Greeting")}, {userDisplayName}";

        HomeTitleText = AppText.T("Main_HomeTitle");
        CategoriesTitle = AppText.T("Main_Categories");
        PopularDishTitle = AppText.T("Main_PopularDish");
        PopularDrinkTitle = AppText.T("Main_PopularDrink");
        SeeAllText = AppText.T("Common_SeeAll");

        Categories.Clear();

        Categories.Add(new HomeCategoryItem(
            key: "mon-hoa",
            title: AppText.T("Main_Category_ChineseCuisine"),
            imageUrl: "cat_chinisecuisine.png"));

        Categories.Add(new HomeCategoryItem(
            key: "lau",
            title: AppText.T("Main_Category_Hotpot"),
            imageUrl: "cat_hotpot.png"));

        Categories.Add(new HomeCategoryItem(
            key: "nuoc-uong",
            title: AppText.T("Main_Category_Drink"),
            imageUrl: "cat_drink.png"));

        Categories.Add(new HomeCategoryItem(
            key: "dimsum",
            title: AppText.T("Main_Category_Dimsum"),
            imageUrl: "cat_dimsum.png"));

        Categories.Add(new HomeCategoryItem(
            key: "mi-hu-tieu",
            title: AppText.T("Main_Category_Noodles"),
            imageUrl: "cat_noodles.png"));
    }

    public async Task LoadDataAsync()
    {
        if (IsLoading)
            return;

        try
        {
            IsLoading = true;

            ApplyLanguage();
            await EnsureUserLocationAsync();

            string language = AppText.CurrentLanguageCode;
            if (string.IsNullOrWhiteSpace(language))
                language = "vi";

            var cachedPois = await _poiCacheService.GetPoisAsync(language);

            if (cachedPois.Count > 0)
            {
                LoadPoisToCollections(cachedPois);
            }

            var onlinePois = await _poiService.GetPoisAsync();

            if (onlinePois.Count > 0)
            {
                await _poiCacheService.SavePoisAsync(language, onlinePois);
                LoadPoisToCollections(onlinePois);
            }
            else if (cachedPois.Count == 0)
            {
                PopularDishes.Clear();
                PopularDrinks.Clear();
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task EnsureUserLocationAsync()
    {
        if (_hasUserLocation)
            return;

        var location = await LocationService.GetCurrentLocationAsync();

        if (location is null)
            return;

        _userLatitude = location.Latitude;
        _userLongitude = location.Longitude;
        _hasUserLocation = true;
    }

    private void LoadPoisToCollections(IEnumerable<Services.PoiDto> pois)
    {
        var orderedPois = SortPoisByDistance(pois);

        PopularDishes.Clear();
        PopularDrinks.Clear();

        foreach (var poi in orderedPois)
        {
            var item = ToPoiMapItem(poi);

            if (IsDrinkPoi(poi))
                PopularDrinks.Add(item);
            else
                PopularDishes.Add(item);
        }

        if (PopularDishes.Count == 0 && orderedPois.Count > 0)
        {
            foreach (var poi in orderedPois.Take(3))
                PopularDishes.Add(ToPoiMapItem(poi));
        }

        if (PopularDrinks.Count == 0 && orderedPois.Count > 0)
        {
            foreach (var poi in orderedPois.Take(Math.Min(3, orderedPois.Count)))
            {
                if (IsDrinkPoi(poi))
                    PopularDrinks.Add(ToPoiMapItem(poi));
            }
        }

        if (PopularDrinks.Count == 0 && orderedPois.Count > 0)
        {
            foreach (var poi in orderedPois.TakeLast(Math.Min(3, orderedPois.Count)))
                PopularDrinks.Add(ToPoiMapItem(poi));
        }
    }

    private List<Services.PoiDto> SortPoisByDistance(IEnumerable<Services.PoiDto> pois)
    {
        var list = pois.ToList();

        if (!_hasUserLocation)
            return list;

        return list
            .OrderBy(x => LocationService.CalculateDistanceKm(
                _userLatitude,
                _userLongitude,
                x.Latitude == 0 ? 10.7609 : x.Latitude,
                x.Longitude == 0 ? 106.6457 : x.Longitude))
            .ThenByDescending(x => x.AverageRating)
            .ToList();
    }

    private static string GetUserDisplayName()
    {
        string fullName = Preferences.Default.Get("FullName", string.Empty);

        if (string.IsNullOrWhiteSpace(fullName))
            return string.Empty;

        string[] parts = fullName
            .Trim()
            .Split(' ', StringSplitOptions.RemoveEmptyEntries);

        if (parts.Length == 0)
            return string.Empty;

        return parts[^1];
    }

    private PoiMapItem ToPoiMapItem(Services.PoiDto poi)
    {
        string categorySlug = poi.Category?.Slug ?? string.Empty;

        string categoryName = GetLocalizedCategoryName(
            categorySlug,
            poi.Category?.Name,
            poi.BadgeText);

        string imageUrl = GetBestImageUrl(poi);

        double safeLatitude = poi.Latitude == 0 ? 10.7609 : poi.Latitude;
        double safeLongitude = poi.Longitude == 0 ? 106.6457 : poi.Longitude;

        return new PoiMapItem
        {
            Id = poi.Id,
            Name = poi.Name,

            Address = string.IsNullOrWhiteSpace(poi.Address)
                ? AppText.T("Search_Address_HTQ_D11")
                : poi.Address,

            Latitude = safeLatitude,
            Longitude = safeLongitude,

            RatingText = string.IsNullOrWhiteSpace(poi.RatingText)
                ? "0.0"
                : poi.RatingText,

            ImageUrl = string.IsNullOrWhiteSpace(imageUrl)
                ? "poi_placeholder.png"
                : imageUrl,

            ShortDescription = poi.ShortDescription,
            FullDescription = poi.FullDescription,

            Category = categoryName,
            BadgeText = categoryName,

            TimeText = poi.TimeText,
            AverageRating = poi.AverageRating,
            TotalReviews = poi.TotalReviews,
            IsFavorite = poi.IsFavorite,

            InfoTags = BuildLocalizedInfoTags(poi.InfoTags, categoryName),

            DistanceKm = _hasUserLocation
                ? LocationService.CalculateDistanceKm(
                    _userLatitude,
                    _userLongitude,
                    safeLatitude,
                    safeLongitude)
                : double.MaxValue
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

            "mon-hoa" => AppText.T("Main_Category_ChineseCuisine"),
            "nha-hang" => AppText.T("Main_Category_ChineseCuisine"),
            "restaurant" => AppText.T("Main_Category_ChineseCuisine"),
            "chinese-cuisine" => AppText.T("Main_Category_ChineseCuisine"),

            _ => !string.IsNullOrWhiteSpace(backendBadgeText)
                ? backendBadgeText
                : backendCategoryName ?? string.Empty
        };
    }

    private static List<string> BuildLocalizedInfoTags(
        List<string>? backendTags,
        string categoryName)
    {
        List<string> result = new();

        if (!string.IsNullOrWhiteSpace(categoryName))
            result.Add(categoryName);

        if (backendTags is null)
            return result;

        foreach (string tag in backendTags)
        {
            if (string.IsNullOrWhiteSpace(tag))
                continue;

            string normalized = tag.Trim().ToLowerInvariant();

            if (normalized is "mì - hủ tiếu"
                or "mì"
                or "mi"
                or "noodles"
                or "nước uống"
                or "đồ uống"
                or "drink"
                or "drinks"
                or "trà"
                or "tra"
                or "lẩu"
                or "lau"
                or "hotpot"
                or "món hoa"
                or "mon-hoa"
                or "chinese cuisine"
                or "dimsum")
            {
                continue;
            }

            result.Add(tag);
        }

        return result;
    }

    private static bool IsDrinkPoi(Services.PoiDto poi)
    {
        string slug = poi.Category?.Slug?.Trim().ToLowerInvariant() ?? string.Empty;

        if (slug is "nuoc-uong" or "tra" or "drink" or "drinks")
            return true;

        string text = $"{poi.Name} {poi.BadgeText} {poi.Category?.Name} {string.Join(" ", poi.InfoTags)}"
            .ToLowerInvariant();

        return text.Contains("trà")
               || text.Contains("tea")
               || text.Contains("drink")
               || text.Contains("drinks")
               || text.Contains("coffee")
               || text.Contains("cafe")
               || text.Contains("café")
               || text.Contains("nước")
               || text.Contains("đồ uống")
               || text.Contains("milk tea");
    }
}

public class HomeCategoryItem
{
    public string Key { get; }
    public string Title { get; }
    public string ImageUrl { get; }

    public HomeCategoryItem(string key, string title, string imageUrl)
    {
        Key = key;
        Title = title;
        ImageUrl = imageUrl;
    }
}