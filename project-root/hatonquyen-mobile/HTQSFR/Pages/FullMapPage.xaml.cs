using System.Globalization;
using System.Text.Json;
using HTQSFR.Models;
using HTQSFR.PageModels;
using HTQSFR.Utilities;
using Microsoft.Maui.ApplicationModel.DataTransfer;
using Microsoft.Maui.Devices.Sensors;
using Microsoft.Maui.Storage;

namespace HTQSFR.Pages;

public partial class FullMapPage : ContentPage
{
    private const double HaTonQuyenCenterLat = 10.7568;
    private const double HaTonQuyenCenterLng = 106.6497;
    private const double TourZoneRadiusKm = 1.5;
    private const double UserVisibleRadiusKm = 1.5;

    private readonly SearchPageModel? _model;
    private readonly PoiMapItem? _focusPoi;

    private readonly bool _hasUserLocation;
    private readonly double _userLatitude;
    private readonly double _userLongitude;
    private readonly bool _isNearbyPickMode;

    public FullMapPage(SearchPageModel model, bool isNearbyPickMode = false)
    {
        InitializeComponent();

        _model = model;
        _isNearbyPickMode = isNearbyPickMode;
        BindingContext = _model;

        _hasUserLocation = model.HasUserLocation;
        _userLatitude = model.UserLatitude;
        _userLongitude = model.UserLongitude;

        LoadFullMap();
    }

    public FullMapPage(PoiMapItem poi)
    {
        InitializeComponent();

        _focusPoi = poi;
        _isNearbyPickMode = false;
        BindingContext = new FullMapFocusModel(poi);

        _hasUserLocation = false;
        _userLatitude = 0;
        _userLongitude = 0;

        LoadFullMap();
    }

    private void LoadFullMap()
    {
        FullMapWebView.Source = new HtmlWebViewSource
        {
            Html = BuildMapHtmlForFullPage()
        };
    }

    private string BuildMapHtmlForFullPage()
    {
        List<MapPoiPayload> pois = BuildMapPoiPayloads();

        string poisJson = JsonSerializer.Serialize(pois);

        bool showUserOnMap =
            _hasUserLocation &&
            IsWithinTourZone(_userLatitude, _userLongitude, UserVisibleRadiusKm);

        string userLocationJson = JsonSerializer.Serialize(new
        {
            hasLocation = showUserOnMap,
            latitude = _userLatitude,
            longitude = _userLongitude
        });

        string activePackVersion = MapConfig.GetActivePackVersion();
        bool packReady = MapConfig.IsActivePackReady() &&
                         !string.IsNullOrWhiteSpace(activePackVersion);

        MapMode preferredMode = MapConfig.GetPreferredMode();
        MapMode effectiveMode = preferredMode switch
        {
            MapMode.Offline when packReady => MapMode.Offline,
            MapMode.Hybrid when packReady => MapMode.Hybrid,
            _ => MapMode.Cloud
        };

        string mapConfigJson = JsonSerializer.Serialize(new
        {
            preferredMode = preferredMode.ToString().ToLowerInvariant(),
            effectiveMode = effectiveMode.ToString().ToLowerInvariant(),
            packReady,
            activePackVersion,
            origin = ApiConfig.Origin
        });

        string mapTextJson = JsonSerializer.Serialize(new
        {
            mode = TextOrDefault("Map_Mode", "mode"),
            streetLabel = TextOrDefault("Map_StreetLabel", "Ha Ton Quyen Street"),
            pickHint = TextOrDefault("Map_PickHint", "Tap the restaurant frontage to get LAT/LNG"),
            pickTitle = TextOrDefault("Map_PickTitle", "Selected coordinates"),
            pickButton = TextOrDefault("Map_PickButton", "Use these coordinates"),
            userLocation = TextOrDefault("Map_UserLocation", "Your location")
        });

        string html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

    <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" />
    <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
    <script src="https://unpkg.com/pmtiles@3.2.0/dist/pmtiles.js"></script>

    <style>
        html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .popup-title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 4px;
        }

        .popup-subtitle {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
        }

        .popup-rating {
            font-size: 12px;
            color: #f97316;
            font-weight: 600;
        }

        .poi-marker {
            width: 16px;
            height: 16px;
            border-radius: 999px;
            background: #F97316;
            border: 2px solid white;
            box-shadow: 0 1px 6px rgba(0,0,0,0.28);
            cursor: pointer;
        }

        .picked-marker {
            width: 18px;
            height: 18px;
            border-radius: 999px;
            background: #2563EB;
            border: 3px solid white;
            box-shadow: 0 1px 8px rgba(0,0,0,0.35);
            cursor: pointer;
        }

        .user-marker {
            width: 14px;
            height: 14px;
            border-radius: 999px;
            background: #60A5FA;
            border: 2px solid #2563EB;
            box-shadow: 0 1px 6px rgba(0,0,0,0.25);
        }

        .street-label {
            background: rgba(255, 255, 255, 0.96);
            color: #111111;
            font-weight: 800;
            font-size: 12px;
            padding: 6px 12px;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.20);
            white-space: nowrap;
            text-align: center;
            border: 1px solid rgba(0,0,0,0.08);
        }

        .mode-badge {
            position: absolute;
            right: 12px;
            top: 12px;
            z-index: 5;
            background: rgba(0,0,0,0.7);
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 5px 9px;
            border-radius: 999px;
        }

        .pick-hint {
            position: absolute;
            left: 12px;
            top: 12px;
            z-index: 5;
            background: rgba(255,255,255,0.94);
            color: #111111;
            font-size: 11px;
            font-weight: 700;
            padding: 7px 10px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.18);
            max-width: 210px;
            line-height: 1.35;
        }

        .pick-popup {
            min-width: 190px;
            font-family: Arial, sans-serif;
        }

        .pick-title {
            font-size: 13px;
            font-weight: 800;
            color: #111111;
            margin-bottom: 6px;
        }

        .pick-coord {
            font-size: 12px;
            color: #333333;
            margin-bottom: 4px;
            word-break: break-all;
        }

        .pick-btn {
            display: inline-block;
            margin-top: 8px;
            background: #2563EB;
            color: white !important;
            text-decoration: none;
            padding: 7px 10px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 700;
        }
    </style>
</head>

<body>
    <div id="map"></div>
    <div class="mode-badge" id="modeBadge"></div>
    <div class="pick-hint" id="pickHint"></div>

    <script>
        const pois = __POIS_JSON__;
        const userLocation = __USER_LOCATION_JSON__;
        const mapConfig = __MAP_CONFIG_JSON__;
        const mapText = __MAP_TEXT_JSON__;
        const haTonQuyenCenter = [__CENTER_LNG__, __CENTER_LAT__];

        let pmtilesProtocolRegistered = false;
        let pickedMarker = null;
        let pickedPopup = null;

        function buildCloudFallbackStyle() {
            return {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap'
                    }
                },
                layers: [
                    {
                        id: 'osm',
                        type: 'raster',
                        source: 'osm'
                    }
                ]
            };
        }

        function absolutizeUrl(baseUrl, value) {
            if (!value) return value;

            try {
                return new URL(value, baseUrl).toString();
            } catch {
                return value;
            }
        }

        function patchStyle(style, styleUrl, pmtilesArchiveUrl) {
            if (!style || typeof style !== 'object') {
                return buildCloudFallbackStyle();
            }

            const cloned = JSON.parse(JSON.stringify(style));

            if (cloned.glyphs) {
                cloned.glyphs = absolutizeUrl(styleUrl, cloned.glyphs);
            }

            if (cloned.sprite) {
                cloned.sprite = absolutizeUrl(styleUrl, cloned.sprite);
            }

            if (cloned.sources && typeof cloned.sources === 'object') {
                Object.keys(cloned.sources).forEach(key => {
                    const source = cloned.sources[key];
                    if (!source || typeof source !== 'object') return;

                    if (typeof source.url === 'string') {
                        if (source.url.includes('__PMTILES_URL__')) {
                            source.url = source.url.replaceAll('__PMTILES_URL__', pmtilesArchiveUrl);
                        } else if (
                            source.url === 'pmtiles://basemap.pmtiles' ||
                            source.url === 'pmtiles://./basemap.pmtiles' ||
                            source.url === 'pmtiles://../basemap.pmtiles'
                        ) {
                            source.url = `pmtiles://${pmtilesArchiveUrl}`;
                        } else if (!source.url.startsWith('pmtiles://') &&
                                   !source.url.startsWith('http://') &&
                                   !source.url.startsWith('https://') &&
                                   !source.url.startsWith('mapbox://')) {
                            source.url = absolutizeUrl(styleUrl, source.url);
                        }
                    }

                    if (!source.url && source.type === 'vector' && key.toLowerCase().includes('base')) {
                        source.url = `pmtiles://${pmtilesArchiveUrl}`;
                    }

                    if (Array.isArray(source.tiles)) {
                        source.tiles = source.tiles.map(x => absolutizeUrl(styleUrl, x));
                    }
                });
            }

            return cloned;
        }

        async function resolveBaseStyle() {
            const mode = mapConfig.effectiveMode;
            const hasPack = mapConfig.packReady && mapConfig.activePackVersion;

            if (!hasPack || mode === 'cloud') {
                return buildCloudFallbackStyle();
            }

            try {
                if (!pmtilesProtocolRegistered) {
                    const protocol = new pmtiles.Protocol();
                    maplibregl.addProtocol('pmtiles', protocol.tile);
                    window.__pmtilesProtocol = protocol;
                    pmtilesProtocolRegistered = true;
                }

                const version = encodeURIComponent(mapConfig.activePackVersion);
                const pmtilesArchiveUrl = `${mapConfig.origin}/api/maps/packs/${version}/basemap.pmtiles`;
                const styleUrl = `${mapConfig.origin}/api/maps/packs/${version}/styles/${mode}/style.json`;

                const archive = new pmtiles.PMTiles(pmtilesArchiveUrl);
                window.__pmtilesProtocol.add(archive);

                const response = await fetch(styleUrl);
                if (!response.ok) {
                    return buildCloudFallbackStyle();
                }

                const style = await response.json();
                return patchStyle(style, styleUrl, pmtilesArchiveUrl);
            } catch {
                return buildCloudFallbackStyle();
            }
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }

        function buildPoiPopupHtml(poi) {
            return `
                <div>
                    <div class="popup-title">${escapeHtml(poi.name)}</div>
                    <div class="popup-subtitle">${escapeHtml(poi.address)}</div>
                    <div class="popup-rating">★ ${escapeHtml(poi.rating)} · ${escapeHtml(poi.category)}</div>
                </div>
            `;
        }

        function buildPickPopupHtml(lat, lng) {
            return `
                <div class="pick-popup">
                    <div class="pick-title">${escapeHtml(mapText.pickTitle)}</div>
                    <div class="pick-coord"><b>lat:</b> ${lat}</div>
                    <div class="pick-coord"><b>lng:</b> ${lng}</div>
                    <a class="pick-btn" href="app://pick?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}">${escapeHtml(mapText.pickButton)}</a>
                </div>
            `;
        }

        async function start() {
            document.getElementById('modeBadge').textContent = `${mapText.mode}: ${mapConfig.effectiveMode}`;

            const pickHintEl = document.getElementById('pickHint');
            if (pickHintEl) {
                pickHintEl.textContent = mapText.pickHint;
            }

            const style = await resolveBaseStyle();

            const map = new maplibregl.Map({
                container: 'map',
                style,
                center: haTonQuyenCenter,
                zoom: 16,
                attributionControl: true
            });

            map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

            map.on('load', () => {
                const streetLabelEl = document.createElement('div');
                streetLabelEl.className = 'street-label';
                streetLabelEl.textContent = mapText.streetLabel;

                new maplibregl.Marker({
                    element: streetLabelEl,
                    anchor: 'center'
                })
                    .setLngLat(haTonQuyenCenter)
                    .addTo(map);

                const poiBoundsPoints = [haTonQuyenCenter];

                pois.forEach(poi => {
                    const el = document.createElement('div');
                    el.className = 'poi-marker';

                    const popup = new maplibregl.Popup({ offset: 18 })
                        .setHTML(buildPoiPopupHtml(poi));

                    new maplibregl.Marker({
                        element: el,
                        anchor: 'center'
                    })
                        .setLngLat([poi.lng, poi.lat])
                        .setPopup(popup)
                        .addTo(map);

                    el.addEventListener('click', evt => {
                        evt.stopPropagation();
                        window.location.href = 'app://poi?id=' + encodeURIComponent(poi.id);
                    });

                    poiBoundsPoints.push([poi.lng, poi.lat]);
                });

                if (userLocation && userLocation.hasLocation) {
                    const userLat = Number(userLocation.latitude);
                    const userLng = Number(userLocation.longitude);

                    if (Number.isFinite(userLat) && Number.isFinite(userLng) && userLat !== 0 && userLng !== 0) {
                        const userEl = document.createElement('div');
                        userEl.className = 'user-marker';

                        new maplibregl.Marker({
                            element: userEl,
                            anchor: 'center'
                        })
                            .setLngLat([userLng, userLat])
                            .setPopup(new maplibregl.Popup().setText(mapText.userLocation))
                            .addTo(map);

                        poiBoundsPoints.push([userLng, userLat]);
                    }
                }

                if (poiBoundsPoints.length > 1) {
                    const bounds = poiBoundsPoints.reduce((acc, lngLat) => {
                        return acc.extend(lngLat);
                    }, new maplibregl.LngLatBounds(poiBoundsPoints[0], poiBoundsPoints[0]));

                    map.fitBounds(bounds, {
                        padding: 40,
                        maxZoom: 17,
                        animate: false
                    });
                } else {
                    map.jumpTo({
                        center: haTonQuyenCenter,
                        zoom: 16
                    });
                }

                map.on('click', e => {
                    const lat = Number(e.lngLat.lat.toFixed(7));
                    const lng = Number(e.lngLat.lng.toFixed(7));

                    if (pickedMarker) {
                        pickedMarker.remove();
                        pickedMarker = null;
                    }

                    if (pickedPopup) {
                        pickedPopup.remove();
                        pickedPopup = null;
                    }

                    const pickedEl = document.createElement('div');
                    pickedEl.className = 'picked-marker';

                    pickedMarker = new maplibregl.Marker({
                        element: pickedEl,
                        anchor: 'center'
                    })
                        .setLngLat([lng, lat])
                        .addTo(map);

                    pickedPopup = new maplibregl.Popup({ offset: 18 })
                        .setLngLat([lng, lat])
                        .setHTML(buildPickPopupHtml(lat, lng))
                        .addTo(map);
                });
            });
        }

        start();
    </script>
</body>
</html>
""";

        string htmlText = html
            .Replace("__POIS_JSON__", poisJson)
            .Replace("__USER_LOCATION_JSON__", userLocationJson)
            .Replace("__MAP_CONFIG_JSON__", mapConfigJson)
            .Replace("__MAP_TEXT_JSON__", mapTextJson)
            .Replace("__CENTER_LAT__", HaTonQuyenCenterLat.ToString(CultureInfo.InvariantCulture))
            .Replace("__CENTER_LNG__", HaTonQuyenCenterLng.ToString(CultureInfo.InvariantCulture));

        return htmlText;
    }

    private List<MapPoiPayload> BuildMapPoiPayloads()
    {
        if (_focusPoi is not null)
        {
            if (IsValidCoordinate(_focusPoi.Latitude, _focusPoi.Longitude) &&
                IsWithinTourZone(_focusPoi.Latitude, _focusPoi.Longitude, TourZoneRadiusKm))
            {
                return new List<MapPoiPayload> { ToMapPayload(_focusPoi) };
            }

            return new List<MapPoiPayload>();
        }

        if (_model?.MapPois is null)
            return new List<MapPoiPayload>();

        var validPois = _model.MapPois
            .Where(x => IsValidCoordinate(x.Latitude, x.Longitude))
            .ToList();

        var inTourZone = validPois
            .Where(x => IsWithinTourZone(x.Latitude, x.Longitude, TourZoneRadiusKm))
            .Select(ToMapPayload)
            .ToList();

        if (inTourZone.Count > 0)
            return inTourZone;

        return validPois
            .OrderBy(x => DistanceToTourCenterKm(x.Latitude, x.Longitude))
            .Take(20)
            .Select(ToMapPayload)
            .ToList();
    }

    private static MapPoiPayload ToMapPayload(PoiMapItem poi)
    {
        return new MapPoiPayload
        {
            id = poi.Id,
            name = string.IsNullOrWhiteSpace(poi.Name) ? "POI" : poi.Name,
            address = string.IsNullOrWhiteSpace(poi.Address)
                ? TextOrDefault("Map_StreetLabel", "Ha Ton Quyen Street")
                : poi.Address,
            category = string.IsNullOrWhiteSpace(poi.Category)
                ? poi.BadgeText
                : poi.Category,
            rating = string.IsNullOrWhiteSpace(poi.RatingText)
                ? "0.0"
                : poi.RatingText,
            lat = poi.Latitude,
            lng = poi.Longitude
        };
    }

    private static bool IsWithinTourZone(double latitude, double longitude, double radiusKm)
    {
        if (!IsValidCoordinate(latitude, longitude))
            return false;

        return DistanceToTourCenterKm(latitude, longitude) <= radiusKm;
    }

    private static double DistanceToTourCenterKm(double latitude, double longitude)
    {
        var from = new Location(HaTonQuyenCenterLat, HaTonQuyenCenterLng);
        var to = new Location(latitude, longitude);

        return Location.CalculateDistance(from, to, DistanceUnits.Kilometers);
    }

    private static bool IsValidCoordinate(double lat, double lng)
    {
        return lat is >= -90 and <= 90
               && lng is >= -180 and <= 180
               && lat != 0
               && lng != 0;
    }

    private async void OnBackTapped(object sender, TappedEventArgs e)
    {
        if (Navigation.NavigationStack.Count > 1)
        {
            await Navigation.PopAsync();
            return;
        }

        await Shell.Current.GoToAsync("//main/search");
    }

    private async void OnViewPoiDetailTapped(object sender, TappedEventArgs e)
    {
        PoiMapItem? poi = _focusPoi ?? _model?.SelectedPoi;

        if (poi is null)
            return;

        await Navigation.PushAsync(new PoiDetailPage(poi));
    }

    private async void OnMapNavigating(object? sender, WebNavigatingEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(e.Url))
            return;

        if (e.Url.StartsWith("app://pick", StringComparison.OrdinalIgnoreCase))
        {
            e.Cancel = true;

            if (!TryParsePickedCoordinates(e.Url, out double lat, out double lng))
                return;

            string latText = lat.ToString(CultureInfo.InvariantCulture);
            string lngText = lng.ToString(CultureInfo.InvariantCulture);

            if (_isNearbyPickMode)
            {
                Preferences.Default.Set("PendingNearbyPickLat", lat);
                Preferences.Default.Set("PendingNearbyPickLng", lng);
                Preferences.Default.Set("PendingNearbyPickMode", true);

                await Navigation.PopAsync();
                return;
            }

            await Clipboard.Default.SetTextAsync($"{latText}, {lngText}");

            await DisplayAlert(
                TextOrDefault("Map_CopiedTitle", "Coordinates copied"),
                $"lat: {latText}\nlng: {lngText}",
                TextOrDefault("Common_OK", "OK"));

            return;
        }

        if (!e.Url.StartsWith("app://poi", StringComparison.OrdinalIgnoreCase))
            return;

        e.Cancel = true;

        string? poiId = ExtractPoiIdFromUrl(e.Url);

        if (string.IsNullOrWhiteSpace(poiId))
            return;

        PoiMapItem? poi = null;

        if (_focusPoi is not null && _focusPoi.Id == poiId)
        {
            poi = _focusPoi;
        }
        else if (_model?.MapPois is not null)
        {
            poi = _model.MapPois.FirstOrDefault(x => x.Id == poiId);
        }

        if (poi is null)
            return;

        if (_model is not null)
        {
            _model.SelectedPoi = poi;
        }

        await MainThread.InvokeOnMainThreadAsync(async () =>
        {
            await Navigation.PushAsync(new PoiDetailPage(poi));
        });
    }

    private static bool TryParsePickedCoordinates(string url, out double lat, out double lng)
    {
        lat = 0;
        lng = 0;

        try
        {
            var uri = new Uri(url);
            string query = uri.Query.TrimStart('?');

            if (string.IsNullOrWhiteSpace(query))
                return false;

            string[] parts = query.Split('&', StringSplitOptions.RemoveEmptyEntries);

            string? latRaw = null;
            string? lngRaw = null;

            foreach (string part in parts)
            {
                string[] pair = part.Split('=', 2);

                if (pair.Length != 2)
                    continue;

                string key = Uri.UnescapeDataString(pair[0]);
                string value = Uri.UnescapeDataString(pair[1]);

                if (key.Equals("lat", StringComparison.OrdinalIgnoreCase))
                    latRaw = value;
                else if (key.Equals("lng", StringComparison.OrdinalIgnoreCase))
                    lngRaw = value;
            }

            if (latRaw is null || lngRaw is null)
                return false;

            return double.TryParse(latRaw, NumberStyles.Any, CultureInfo.InvariantCulture, out lat)
                   && double.TryParse(lngRaw, NumberStyles.Any, CultureInfo.InvariantCulture, out lng);
        }
        catch
        {
            return false;
        }
    }

    private static string? ExtractPoiIdFromUrl(string url)
    {
        try
        {
            const string marker = "id=";
            int index = url.IndexOf(marker, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return null;

            string raw = url[(index + marker.Length)..];

            int ampIndex = raw.IndexOf('&', StringComparison.Ordinal);

            if (ampIndex >= 0)
                raw = raw[..ampIndex];

            return Uri.UnescapeDataString(raw);
        }
        catch
        {
            return null;
        }
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }

    private sealed class MapPoiPayload
    {
        public string id { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public string address { get; set; } = string.Empty;
        public string category { get; set; } = string.Empty;
        public string rating { get; set; } = string.Empty;
        public double lat { get; set; }
        public double lng { get; set; }
    }
}

public sealed class FullMapFocusModel
{
    public PoiMapItem SelectedPoi { get; }

    public bool HasSelectedPoi => false;

    public FullMapFocusModel(PoiMapItem poi)
    {
        SelectedPoi = poi;
    }
}