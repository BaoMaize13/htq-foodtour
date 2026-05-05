using CommunityToolkit.Mvvm.ComponentModel;
using HTQSFR.Models;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Maui.Controls;
using System.Collections.ObjectModel;
using System.Linq;

namespace HTQSFR.PageModels;

public partial class SearchPageModel : ObservableObject
{
    private readonly PoiService _poiService = new();
    private readonly PoiAudioPlaybackQueueService _audioQueue =
        ResolveService<PoiAudioPlaybackQueueService>();

    private const string FilterLocation = "location";
    private const string FilterNearby = "nearby";
    private const string FilterPrice = "price";
    private const string FilterType = "type";

    private const string PriceAll = "all";
    private const string PriceUnder50 = "under50";
    private const string Price50To100 = "50to100";
    private const string PriceOver100 = "over100";

    private const string TypeAll = "all";

    private const string NearbyNone = "none";
    private const string NearbyGps = "gps";
    private const string NearbyPicked = "picked";

    private string _selectedNearbyKey = NearbyNone;
    private double _nearbyReferenceLatitude;
    private double _nearbyReferenceLongitude;

    private string _activeFilterKey = FilterLocation;
    private string _selectedPriceKey = PriceAll;
    private string _selectedTypeKey = TypeAll;

    private readonly Dictionary<string, string> _priceKeyByPlaceId = new();
    private readonly Dictionary<string, string> _typeKeyByPlaceId = new();

    [ObservableProperty]
    private string searchText = string.Empty;

    [ObservableProperty]
    private bool isLocationMode = true;

    [ObservableProperty]
    private PoiMapItem? selectedPoi;

    [ObservableProperty]
    private bool hasSelectedPoi;

    [ObservableProperty]
    private bool isLoading;

    [ObservableProperty]
    private bool hasUserLocation;

    [ObservableProperty]
    private double userLatitude;

    [ObservableProperty]
    private double userLongitude;

    public ObservableCollection<FilterChipItem> Filters { get; } = new();

    private List<SearchPlaceItem> _allPlaces = new();

    public ObservableCollection<SearchPlaceItem> Places { get; } = new();

    public ObservableCollection<PoiMapItem> MapPois { get; } = new();

    public SearchPageModel()
    {
        InitFilters();
    }

    private void InitFilters()
    {
        Filters.Clear();

        Filters.Add(new FilterChipItem(
            key: FilterLocation,
            title: AppText.T("Search_Filter_Location"),
            isSelected: _activeFilterKey == FilterLocation));

        Filters.Add(new FilterChipItem(
            key: FilterNearby,
            title: AppText.T("Search_Filter_Nearby"),
            isSelected: _activeFilterKey == FilterNearby));

        Filters.Add(new FilterChipItem(
            key: FilterPrice,
            title: AppText.T("Search_Filter_Price"),
            isSelected: _activeFilterKey == FilterPrice));

        Filters.Add(new FilterChipItem(
            key: FilterType,
            title: AppText.T("Search_Filter_Type"),
            isSelected: _activeFilterKey == FilterType));
    }

    public async Task LoadDataAsync()
    {
        if (IsLoading)
            return;

        try
        {
            IsLoading = true;

            await EnsureUserLocationAsync();

            var onlinePois = await _poiService.GetPoisAsync();

            if (onlinePois.Count > 0)
            {
                LoadFromBackend(onlinePois);
                ApplyFilter();

                _ = HotsetService.PreloadNearestAsync(
                    onlinePois,
                    UserLatitude,
                    UserLongitude,
                    HasUserLocation,
                    _poiService);
            }
            else if (_allPlaces.Count == 0)
            {
                LoadEmptyData();
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    public async Task RefreshLanguageAsync()
    {
        InitFilters();
        await LoadDataAsync();
        ApplyFilter();
    }

    public string GetPriceFilterTitle()
    {
        return _selectedPriceKey switch
        {
            PriceUnder50 => "Dưới 50.000đ",
            Price50To100 => "50.000đ - 100.000đ",
            PriceOver100 => "Trên 100.000đ",
            _ => AppText.T("Search_Filter_Price")
        };
    }

    public string GetNearbyFilterTitle()
    {
        return _selectedNearbyKey switch
        {
            NearbyGps => TextOrDefault("Search_Filter_Nearby_GpsActive", "GPS"),
            NearbyPicked => TextOrDefault("Search_Filter_Nearby_PickActive", "Picked point"),
            _ => TextOrDefault("Search_Filter_Nearby", "Nearby")
        };
    }

    public string GetPriceRangeSummaryText()
    {
        return _selectedPriceKey switch
        {
            PriceUnder50 => "Dưới 50.000đ",
            Price50To100 => "50.000đ - 100.000đ",
            PriceOver100 => "Trên 100.000đ",
            _ => "Tất cả giá"
        };
    }

    public string GetTypeFilterTitle()
    {
        return _selectedTypeKey switch
        {
            "mon-hoa" => AppText.T("Main_Category_ChineseCuisine"),
            "mi-hu-tieu" => AppText.T("Main_Category_Noodles"),
            "lau" => AppText.T("Main_Category_Hotpot"),
            "nuoc-uong" => AppText.T("Main_Category_Drink"),
            "dimsum" => AppText.T("Main_Category_Dimsum"),
            _ => AppText.T("Search_Filter_Type")
        };
    }

    public void ApplyPriceFilter(string priceKey)
    {
        _selectedPriceKey = string.IsNullOrWhiteSpace(priceKey)
            ? PriceAll
            : priceKey;

        SelectFilter(FilterPrice);
    }

    public void ApplyTypeFilter(string typeKey)
    {
        _selectedTypeKey = string.IsNullOrWhiteSpace(typeKey)
            ? TypeAll
            : typeKey;

        SelectFilter(FilterType);
    }

    public async Task ApplyNearbyFromGpsAsync()
    {
        var location = await LocationService.GetCurrentLocationAsync();

        if (location is null)
            return;

        _selectedNearbyKey = NearbyGps;
        _nearbyReferenceLatitude = location.Latitude;
        _nearbyReferenceLongitude = location.Longitude;

        UserLatitude = location.Latitude;
        UserLongitude = location.Longitude;
        HasUserLocation = true;

        SelectFilter(FilterNearby);
        ApplyFilter();

        await AutoQueueNearbyAudioAsync();
    }

    public async Task ApplyNearbyFromPickedPointAsync(double lat, double lng)
    {
        if (!IsValidCoordinate(lat, lng))
            return;

        _selectedNearbyKey = NearbyPicked;
        _nearbyReferenceLatitude = lat;
        _nearbyReferenceLongitude = lng;

        UserLatitude = lat;
        UserLongitude = lng;
        HasUserLocation = true;

        SelectFilter(FilterNearby);
        ApplyFilter();

        await AutoQueueNearbyAudioAsync();
    }

    public void ClearNearbyFilter()
    {
        _selectedNearbyKey = NearbyNone;
        _nearbyReferenceLatitude = 0;
        _nearbyReferenceLongitude = 0;

        _ = _audioQueue.StopAsync();

        SelectFilter(FilterLocation);
    }

    private async Task EnsureUserLocationAsync()
    {
        if (HasUserLocation)
            return;

        var location = await LocationService.GetCurrentLocationAsync();

        if (location is null)
            return;

        UserLatitude = location.Latitude;
        UserLongitude = location.Longitude;
        HasUserLocation = true;
    }

    private void LoadFromBackend(List<Services.PoiDto> pois)
    {
        _priceKeyByPlaceId.Clear();
        _typeKeyByPlaceId.Clear();

        _allPlaces = pois.Select(p =>
        {
            string placeId = !string.IsNullOrWhiteSpace(p.Id)
                ? p.Id
                : Guid.NewGuid().ToString("N");

            string categorySlug = NormalizeCategorySlug(
                p.Category?.Slug,
                p.Category?.Name,
                p.BadgeText);

            string priceKey = BuildPriceKey(categorySlug);
            double distanceKm = CalculateDistanceKm(p.Latitude, p.Longitude);

            _priceKeyByPlaceId[placeId] = priceKey;
            _typeKeyByPlaceId[placeId] = categorySlug;

            return new SearchPlaceItem
            {
                Id = placeId,
                Name = p.Name,
                RatingText = p.RatingText,
                PriceText = BuildPriceText(priceKey),
                TimeText = string.IsNullOrWhiteSpace(p.TimeText)
                    ? string.Empty
                    : p.TimeText,
                BadgeText = string.IsNullOrWhiteSpace(p.BadgeText)
                    ? p.Category?.Name ?? string.Empty
                    : p.BadgeText,
                ImageUrl = string.IsNullOrWhiteSpace(p.ImageUrl)
                    ? string.Empty
                    : p.ImageUrl,
                Address = string.IsNullOrWhiteSpace(p.Address)
                    ? string.Empty
                    : p.Address,
                Latitude = p.Latitude,
                Longitude = p.Longitude,
                ShortDescription = p.ShortDescription,
                FullDescription = p.FullDescription,
                Category = string.IsNullOrWhiteSpace(p.Category?.Name)
                    ? p.BadgeText
                    : p.Category.Name,
                AverageRating = p.AverageRating,
                TotalReviews = p.TotalReviews,
                IsFavorite = p.IsFavorite,
                InfoTags = p.InfoTags ?? new List<string>(),
                DistanceKm = distanceKm
            };
        }).ToList();

        _allPlaces = SortPlacesByDistance(_allPlaces);
    }

    private void LoadEmptyData()
    {
        _allPlaces = new List<SearchPlaceItem>();
        _priceKeyByPlaceId.Clear();
        _typeKeyByPlaceId.Clear();

        Places.Clear();
        MapPois.Clear();

        SelectedPoi = null;
        HasSelectedPoi = false;
    }

    partial void OnSearchTextChanged(string value)
    {
        ApplyFilter();
    }

    partial void OnSelectedPoiChanged(PoiMapItem? value)
    {
        HasSelectedPoi = value != null;
    }

    public void SelectFilter(string titleOrKey)
    {
        var selectedFilter = Filters.FirstOrDefault(f =>
            f.Key == titleOrKey || f.Title == titleOrKey);

        if (selectedFilter is null)
            return;

        _activeFilterKey = selectedFilter.Key;

        foreach (var f in Filters)
            f.IsSelected = f.Key == selectedFilter.Key;

        IsLocationMode = selectedFilter.Key == FilterLocation;

        if (!IsLocationMode)
            SelectedPoi = null;

        ApplyFilter();
    }

    private void ApplyFilter()
    {
        var query = _allPlaces.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(SearchText))
        {
            query = query.Where(x =>
                (!string.IsNullOrWhiteSpace(x.Name) &&
                 x.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrWhiteSpace(x.Address) &&
                 x.Address.Contains(SearchText, StringComparison.OrdinalIgnoreCase)));
        }

        if (_selectedPriceKey != PriceAll)
        {
            query = query.Where(x =>
                _priceKeyByPlaceId.TryGetValue(x.Id, out var priceKey) &&
                priceKey == _selectedPriceKey);
        }

        if (_selectedTypeKey != TypeAll)
        {
            query = query.Where(x =>
                _typeKeyByPlaceId.TryGetValue(x.Id, out var typeKey) &&
                typeKey == _selectedTypeKey);
        }

        var result = SortPlacesByDistance(query);

        Places.Clear();

        foreach (var item in result)
            Places.Add(item);

        SyncMapPois(result);
    }

    private List<SearchPlaceItem> SortPlacesByDistance(IEnumerable<SearchPlaceItem> places)
    {
        var list = places.ToList();

        bool useNearbyRef =
            _selectedNearbyKey != NearbyNone &&
            IsValidCoordinate(_nearbyReferenceLatitude, _nearbyReferenceLongitude);

        if (useNearbyRef)
        {
            return list
                .Select(x =>
                {
                    x.DistanceKm = LocationService.CalculateDistanceKm(
                        _nearbyReferenceLatitude,
                        _nearbyReferenceLongitude,
                        x.Latitude,
                        x.Longitude);

                    return x;
                })
                .Where(x => x.DistanceKm != double.MaxValue)
                .OrderBy(x => x.DistanceKm)
                .ThenByDescending(x => x.AverageRating)
                .Take(10)
                .ToList();
        }

        if (!HasUserLocation)
            return list;

        return list
            .OrderBy(x => x.DistanceKm)
            .ThenByDescending(x => x.AverageRating)
            .ToList();
    }

    private async Task AutoQueueNearbyAudioAsync()
    {
        var nearestPois = Places
            .Where(x => IsValidCoordinate(x.Latitude, x.Longitude))
            .Where(x => x.DistanceKm != double.MaxValue)
            .OrderBy(x => x.DistanceKm)
            .ThenByDescending(x => x.AverageRating)
            .Take(3)
            .Select(ToPoiMapItem)
            .ToList();

        if (nearestPois.Count == 0)
        {
            nearestPois = MapPois
                .Where(x => IsValidCoordinate(x.Latitude, x.Longitude))
                .Where(x => x.DistanceKm != double.MaxValue)
                .OrderBy(x => x.DistanceKm)
                .ThenByDescending(x => x.AverageRating)
                .Take(3)
                .ToList();
        }

        if (nearestPois.Count == 0)
        {
            bool hasNearbyReference =
                _selectedNearbyKey != NearbyNone &&
                IsValidCoordinate(_nearbyReferenceLatitude, _nearbyReferenceLongitude);

            if (hasNearbyReference)
            {
                nearestPois = _allPlaces
                    .Where(x => IsValidCoordinate(x.Latitude, x.Longitude))
                    .Select(x =>
                    {
                        x.DistanceKm = LocationService.CalculateDistanceKm(
                            _nearbyReferenceLatitude,
                            _nearbyReferenceLongitude,
                            x.Latitude,
                            x.Longitude);

                        return x;
                    })
                    .Where(x => x.DistanceKm != double.MaxValue)
                    .OrderBy(x => x.DistanceKm)
                    .ThenByDescending(x => x.AverageRating)
                    .Take(3)
                    .Select(ToPoiMapItem)
                    .ToList();
            }
        }

        if (nearestPois.Count == 0)
        {
            await _audioQueue.StopAsync();
            return;
        }

        await _audioQueue.ReplaceQueueAsync(nearestPois);
    }

    private void SyncMapPois(IEnumerable<SearchPlaceItem> places)
    {
        MapPois.Clear();

        foreach (var p in places)
        {
            if (!IsValidCoordinate(p.Latitude, p.Longitude))
                continue;

            MapPois.Add(ToPoiMapItem(p));
        }

        if (SelectedPoi is not null)
        {
            SelectedPoi = MapPois.FirstOrDefault(x => x.Id == SelectedPoi.Id);
        }
    }

    private static PoiMapItem ToPoiMapItem(SearchPlaceItem p)
    {
        return new PoiMapItem
        {
            Id = p.Id,
            Name = p.Name,
            Address = p.Address,
            Latitude = p.Latitude,
            Longitude = p.Longitude,
            RatingText = p.RatingText,
            ImageUrl = p.ImageUrl,
            ShortDescription = p.ShortDescription,
            FullDescription = p.FullDescription,
            Category = p.Category,
            BadgeText = p.BadgeText,
            TimeText = p.TimeText,
            AverageRating = p.AverageRating,
            TotalReviews = p.TotalReviews,
            IsFavorite = p.IsFavorite,
            InfoTags = p.InfoTags,
            DistanceKm = p.DistanceKm
        };
    }

    public void SelectPoi(PoiMapItem poi)
    {
        SelectedPoi = poi;
    }

    public void ClearSelectedPoi()
    {
        SelectedPoi = null;
    }

    private double CalculateDistanceKm(double latitude, double longitude)
    {
        if (!HasUserLocation)
            return double.MaxValue;

        if (!IsValidCoordinate(latitude, longitude))
            return double.MaxValue;

        return LocationService.CalculateDistanceKm(
            UserLatitude,
            UserLongitude,
            latitude,
            longitude);
    }

    private static bool IsValidCoordinate(double latitude, double longitude)
    {
        return latitude is >= -90 and <= 90
               && longitude is >= -180 and <= 180
               && latitude != 0
               && longitude != 0;
    }

    private static string BuildPriceKey(string categorySlug)
    {
        return categorySlug switch
        {
            "nuoc-uong" => PriceUnder50,
            "dimsum" => Price50To100,
            "mi-hu-tieu" => Price50To100,
            "mon-hoa" => Price50To100,
            "lau" => PriceOver100,
            _ => Price50To100
        };
    }

    private static string BuildPriceText(string priceKey)
    {
        return priceKey switch
        {
            PriceUnder50 => "Dưới 50.000đ",
            Price50To100 => "50.000đ - 100.000đ",
            PriceOver100 => "Trên 100.000đ",
            _ => "50.000đ - 100.000đ"
        };
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private static string NormalizeCategorySlug(
        string? slug,
        string? categoryName,
        string? badgeText)
    {
        string value = (slug ?? string.Empty).Trim().ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(value))
        {
            return value switch
            {
                "mi" => "mi-hu-tieu",
                "noodles" => "mi-hu-tieu",
                "hotpot" => "lau",
                "drink" => "nuoc-uong",
                "drinks" => "nuoc-uong",
                "tra" => "nuoc-uong",
                "restaurant" => "mon-hoa",
                "nha-hang" => "mon-hoa",
                "chinese-cuisine" => "mon-hoa",
                _ => value
            };
        }

        string text = $"{categoryName} {badgeText}".Trim().ToLowerInvariant();

        if (text.Contains("dimsum") || text.Contains("điểm tâm"))
            return "dimsum";

        if (text.Contains("mì") ||
            text.Contains("hu") ||
            text.Contains("hủ") ||
            text.Contains("noodle") ||
            text.Contains("nouille") ||
            text.Contains("fideo"))
            return "mi-hu-tieu";

        if (text.Contains("lẩu") ||
            text.Contains("lau") ||
            text.Contains("hotpot") ||
            text.Contains("火鍋") ||
            text.Contains("火锅"))
            return "lau";

        if (text.Contains("nước") ||
            text.Contains("drink") ||
            text.Contains("drinks") ||
            text.Contains("trà") ||
            text.Contains("tea") ||
            text.Contains("boisson"))
            return "nuoc-uong";

        return "mon-hoa";
    }

    private static T ResolveService<T>() where T : class, new()
    {
        return Application.Current?.Handler?.MauiContext?.Services.GetService<T>()
               ?? new T();
    }
}

public partial class FilterChipItem : ObservableObject
{
    public string Key { get; }

    [ObservableProperty]
    private string title;

    [ObservableProperty]
    private bool isSelected;

    public FilterChipItem(string key, string title, bool isSelected = false)
    {
        Key = key;
        Title = title;
        IsSelected = isSelected;
    }
}