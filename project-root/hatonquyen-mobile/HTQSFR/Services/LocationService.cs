using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Devices.Sensors;
using Microsoft.Maui.Storage;

namespace HTQSFR.Services;

public static class LocationService
{
    private const string LastLatitudeKey = "last_user_latitude";
    private const string LastLongitudeKey = "last_user_longitude";
    private const string HasLastLocationKey = "has_last_user_location";

    public static async Task<Location?> GetCurrentLocationAsync()
    {
        try
        {
            var permissionStatus =
                await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();

            if (permissionStatus != PermissionStatus.Granted)
            {
                permissionStatus =
                    await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
            }

            if (permissionStatus != PermissionStatus.Granted)
                return GetCachedLocation();

            var request = new GeolocationRequest(
                GeolocationAccuracy.Medium,
                TimeSpan.FromSeconds(10));

            var location = await Geolocation.Default.GetLocationAsync(request);

            if (location is not null)
            {
                CacheLocation(location);
                return location;
            }

            location = await Geolocation.Default.GetLastKnownLocationAsync();

            if (location is not null)
            {
                CacheLocation(location);
                return location;
            }

            return GetCachedLocation();
        }
        catch
        {
            return GetCachedLocation();
        }
    }

    public static double CalculateDistanceKm(
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

    private static void CacheLocation(Location location)
    {
        Preferences.Default.Set(LastLatitudeKey, location.Latitude);
        Preferences.Default.Set(LastLongitudeKey, location.Longitude);
        Preferences.Default.Set(HasLastLocationKey, true);
    }

    private static Location? GetCachedLocation()
    {
        bool hasCachedLocation = Preferences.Default.Get(HasLastLocationKey, false);

        if (!hasCachedLocation)
            return null;

        double latitude = Preferences.Default.Get(LastLatitudeKey, 0d);
        double longitude = Preferences.Default.Get(LastLongitudeKey, 0d);

        if (!IsValidCoordinate(latitude, longitude))
            return null;

        return new Location(latitude, longitude);
    }

    private static bool IsValidCoordinate(double latitude, double longitude)
    {
        return latitude is >= -90 and <= 90
               && longitude is >= -180 and <= 180
               && latitude != 0
               && longitude != 0;
    }
}