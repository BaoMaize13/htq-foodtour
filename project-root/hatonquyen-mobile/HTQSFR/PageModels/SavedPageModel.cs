using CommunityToolkit.Mvvm.ComponentModel;
using HTQSFR.Models;
using HTQSFR.Services;
using HTQSFR.Utilities;
using System.Collections.ObjectModel;

namespace HTQSFR.PageModels;

public partial class SavedPageModel : ObservableObject
{
    private readonly PoiService _poiService = new();

    private string _selectedFilterKey = "time";

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool isEmpty = true;

    [ObservableProperty]
    private string titleText = string.Empty;

    [ObservableProperty]
    private string emptyText = string.Empty;

    public ObservableCollection<SavedFilterItem> Filters { get; } = new();

    public ObservableCollection<PoiMapItem> SavedItems { get; } = new();

    private List<PoiMapItem> _allSavedItems = new();

    public SavedPageModel()
    {
        ApplyLanguage();
    }

    public void ApplyLanguage()
    {
        TitleText = AppText.T("Saved_Title");
        EmptyText = TextOrDefault("Saved_Empty", "No saved places yet.");

        bool isTimeSelected = _selectedFilterKey == "time";
        bool isNameSelected = _selectedFilterKey == "name";

        Filters.Clear();

        Filters.Add(new SavedFilterItem(
            key: "time",
            title: AppText.T("Saved_Filter_Time"),
            isSelected: isTimeSelected));

        Filters.Add(new SavedFilterItem(
            key: "name",
            title: AppText.T("Saved_Filter_Name"),
            isSelected: isNameSelected));
    }

    public async Task LoadDataAsync()
    {
        if (IsLoading)
            return;

        try
        {
            IsLoading = true;

            ApplyLanguage();

            SavedItems.Clear();
            _allSavedItems.Clear();

            bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

            if (!isLoggedIn)
            {
                EmptyText = TextOrDefault(
                    "Saved_LoginRequired",
                    "Please login to view saved places.");

                IsEmpty = true;
                return;
            }

            // QUAN TRỌNG:
            // SavedPage phải gọi GetFavoritePoisAsync()
            // vì hàm này gửi token để backend trả isFavorite đúng theo user.
            var pois = await _poiService.GetFavoritePoisAsync();

            _allSavedItems = pois
                .Select(ToPoiMapItem)
                .ToList();

            ApplySort(_selectedFilterKey);

            EmptyText = TextOrDefault(
                "Saved_Empty",
                "No saved places yet.");
        }
        finally
        {
            IsLoading = false;
        }
    }

    public void SelectFilter(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            return;

        _selectedFilterKey = key;

        foreach (var filter in Filters)
            filter.IsSelected = filter.Key == key;

        ApplySort(key);
    }

    private void ApplySort(string key)
    {
        IEnumerable<PoiMapItem> query = _allSavedItems;

        if (key == "name")
        {
            query = query.OrderBy(x => x.Name);
        }
        else
        {
            query = query.OrderBy(x => string.IsNullOrWhiteSpace(x.TimeText))
                         .ThenBy(x => x.TimeText)
                         .ThenBy(x => x.Name);
        }

        SavedItems.Clear();

        foreach (var item in query)
            SavedItems.Add(item);

        IsEmpty = SavedItems.Count == 0;
    }

    private static PoiMapItem ToPoiMapItem(Services.PoiDto poi)
    {
        string categorySlug = poi.Category?.Slug ?? string.Empty;

        string categoryName = GetLocalizedCategoryName(
            categorySlug,
            poi.Category?.Name,
            poi.BadgeText);

        string imageUrl = GetBestImageUrl(poi);

        return new PoiMapItem
        {
            Id = poi.Id,
            Name = poi.Name,

            Address = string.IsNullOrWhiteSpace(poi.Address)
                ? AppText.T("Search_Address_HTQ_D11")
                : poi.Address,

            Latitude = poi.Latitude == 0 ? 10.7609 : poi.Latitude,
            Longitude = poi.Longitude == 0 ? 106.6457 : poi.Longitude,

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
            BadgeText = categoryName,

            TimeText = poi.TimeText,
            AverageRating = poi.AverageRating,
            TotalReviews = poi.TotalReviews,
            IsFavorite = true,
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

            _ => !string.IsNullOrWhiteSpace(backendBadgeText)
                ? backendBadgeText
                : backendCategoryName ?? string.Empty
        };
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }
}

public partial class SavedFilterItem : ObservableObject
{
    public string Key { get; }

    [ObservableProperty]
    private string title;

    [ObservableProperty]
    private bool isSelected;

    public SavedFilterItem(string key, string title, bool isSelected = false)
    {
        Key = key;
        Title = title;
        IsSelected = isSelected;
    }
}