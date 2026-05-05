using System.Collections.Concurrent;
using Microsoft.Maui.Devices.Sensors;

namespace HTQSFR.Services;

public static class HotsetService
{
    private const int MaxHotPois = 10;
    private const double RadiusKm = 1.5;

    private static readonly SemaphoreSlim PreloadLock = new(1, 1);
    private static readonly PoiAudioFileCacheService AudioFileCacheService = new();

    private static readonly ConcurrentDictionary<string, PoiDto> PoiCache = new();
    private static readonly ConcurrentDictionary<string, List<PoiMenuItemDto>> MenuCache = new();
    private static readonly ConcurrentDictionary<string, PoiAudioDto> AudioCache = new();

    public static void ClearAll()
    {
        PoiCache.Clear();
        MenuCache.Clear();
        AudioCache.Clear();
    }

    public static bool TryGetPoi(string poiId, out PoiDto? poi)
    {
        poi = null;

        if (string.IsNullOrWhiteSpace(poiId))
            return false;

        if (PoiCache.TryGetValue(poiId, out var cached))
        {
            poi = cached;
            return true;
        }

        return false;
    }

    public static bool TryGetMenu(string poiId, out List<PoiMenuItemDto>? items)
    {
        items = null;

        if (string.IsNullOrWhiteSpace(poiId))
            return false;

        if (MenuCache.TryGetValue(poiId, out var cached))
        {
            items = cached;
            return true;
        }

        return false;
    }

    public static bool TryGetAudio(string poiId, out PoiAudioDto? audio)
    {
        audio = null;

        if (string.IsNullOrWhiteSpace(poiId))
            return false;

        if (AudioCache.TryGetValue(poiId, out var cached))
        {
            audio = cached;
            return true;
        }

        return false;
    }

    public static void StorePoi(PoiDto poi)
    {
        if (poi is null || string.IsNullOrWhiteSpace(poi.Id))
            return;

        PoiCache[poi.Id] = poi;
    }

    public static void StoreMenu(string poiId, List<PoiMenuItemDto> items)
    {
        if (string.IsNullOrWhiteSpace(poiId) || items is null)
            return;

        MenuCache[poiId] = items;
    }

    public static void StoreAudio(string poiId, PoiAudioDto audio)
    {
        if (string.IsNullOrWhiteSpace(poiId) || audio is null)
            return;

        AudioCache[poiId] = audio;
    }

    public static void UpdateFavoriteState(string poiId, bool isFavorite)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return;

        if (PoiCache.TryGetValue(poiId, out var cachedPoi))
        {
            cachedPoi.IsFavorite = isFavorite;
            PoiCache[poiId] = cachedPoi;
        }
    }

    public static async Task PreloadNearestAsync(
        List<PoiDto> pois,
        double userLatitude,
        double userLongitude,
        bool hasUserLocation,
        PoiService poiService)
    {
        if (!hasUserLocation || pois is null || pois.Count == 0)
            return;

        if (!await PreloadLock.WaitAsync(0))
            return;

        try
        {
            var candidates = pois
                .Where(x => !string.IsNullOrWhiteSpace(x.Id))
                .Where(x => IsValidCoordinate(x.Latitude, x.Longitude))
                .Select(x => new
                {
                    Poi = x,
                    DistanceKm = CalculateDistanceKm(
                        userLatitude,
                        userLongitude,
                        x.Latitude,
                        x.Longitude)
                })
                .Where(x => x.DistanceKm != double.MaxValue)
                .ToList();

            var nearestWithinRadius = candidates
                .Where(x => x.DistanceKm <= RadiusKm)
                .OrderBy(x => x.DistanceKm)
                .Take(MaxHotPois)
                .Select(x => x.Poi)
                .ToList();

            var targets = nearestWithinRadius.Count > 0
                ? nearestWithinRadius
                : candidates
                    .OrderBy(x => x.DistanceKm)
                    .Take(MaxHotPois)
                    .Select(x => x.Poi)
                    .ToList();

            var tasks = targets.Select(async poi =>
            {
                try
                {
                    var detail = await poiService.GetPoiByIdAsync(poi.Id);
                    if (detail is not null)
                        StorePoi(detail);

                    var menu = await poiService.GetPoiMenuAsync(poi.Id);
                    if (menu.Count > 0)
                        StoreMenu(poi.Id, menu);

                    var audio = await poiService.GetPoiAudioAsync(poi.Id);
                    if (audio is not null)
                    {
                        StoreAudio(poi.Id, audio);
                        await AudioFileCacheService.GetOrCacheAudioFileAsync(poi.Id, audio);
                    }
                }
                catch
                {
                }
            });

            await Task.WhenAll(tasks);
        }
        finally
        {
            PreloadLock.Release();
        }
    }

    private static double CalculateDistanceKm(
        double fromLatitude,
        double fromLongitude,
        double toLatitude,
        double toLongitude)
    {
        if (!IsValidCoordinate(fromLatitude, fromLongitude) ||
            !IsValidCoordinate(toLatitude, toLongitude))
        {
            return double.MaxValue;
        }

        var from = new Location(fromLatitude, fromLongitude);
        var to = new Location(toLatitude, toLongitude);

        return Location.CalculateDistance(from, to, DistanceUnits.Kilometers);
    }

    private static bool IsValidCoordinate(double latitude, double longitude)
    {
        return latitude is >= -90 and <= 90
               && longitude is >= -180 and <= 180
               && latitude != 0
               && longitude != 0;
    }
}