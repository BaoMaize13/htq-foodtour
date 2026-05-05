using HTQSFR.Models;
using HTQSFR.PageModels;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;
using System.Linq;
using System.Text.Json;

namespace HTQSFR.Pages;

public partial class SearchPage : ContentPage
{
    private const string PendingSearchTypeFilterKey = "PendingSearchTypeFilter";
    private const string PendingNearbyPickLatKey = "PendingNearbyPickLat";
    private const string PendingNearbyPickLngKey = "PendingNearbyPickLng";
    private const string PendingNearbyPickModeKey = "PendingNearbyPickMode";

    private readonly SearchPageModel _model;

    public SearchPage()
    {
        InitializeComponent();

        _model = new SearchPageModel();
        BindingContext = _model;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();

        ApplyLanguage();

        await _model.LoadDataAsync();

        ApplyPendingTypeFilterIfAny();
        ApplyPendingNearbyPickIfAny();

        UpdateFilterChipLabels();
        LoadMapHtml();
    }

    private void ApplyLanguage()
    {
        FlowDirection = AppText.GetFlowDirection();

        SearchEntry.Placeholder = AppText.T("Search_Placeholder");
        LocationChipLabel.Text = AppText.T("Search_Filter_Location");
        NearbyChipLabel.Text = _model.GetNearbyFilterTitle();
        PriceChipLabel.Text = _model.GetPriceFilterTitle();
        TypeChipLabel.Text = _model.GetTypeFilterTitle();
        OpenFullMapLabel.Text = AppText.T("Search_OpenFullMap");
        ViewDetailsLabel.Text = AppText.T("Search_ViewDetails");
        TopPlacesLabel.Text = AppText.T("Search_TopPlaces");
        ResultsCountLabel.Text = AppText.T("Search_ResultsCount");
        DistrictLabel.Text = AppText.T("Search_District");
        PriceRangeLabel.Text = "⌂ " + _model.GetPriceRangeSummaryText();
        OpenNowLabel.Text = AppText.T("Search_OpenNow");
    }

    private void ApplyPendingTypeFilterIfAny()
    {
        string pendingType = Preferences.Default.Get(PendingSearchTypeFilterKey, string.Empty);

        if (string.IsNullOrWhiteSpace(pendingType))
            return;

        Preferences.Default.Remove(PendingSearchTypeFilterKey);
        _model.ApplyTypeFilter(pendingType);
    }

    private async void ApplyPendingNearbyPickIfAny()
    {
        bool hasMode = Preferences.Default.Get(PendingNearbyPickModeKey, false);

        if (!hasMode)
            return;

        double lat = Preferences.Default.Get(PendingNearbyPickLatKey, 0d);
        double lng = Preferences.Default.Get(PendingNearbyPickLngKey, 0d);

        Preferences.Default.Remove(PendingNearbyPickLatKey);
        Preferences.Default.Remove(PendingNearbyPickLngKey);
        Preferences.Default.Remove(PendingNearbyPickModeKey);

        if (lat == 0 || lng == 0)
            return;

        await _model.ApplyNearbyFromPickedPointAsync(lat, lng);

        UpdateFilterChipLabels();
        LoadMapHtml();
    }

    private void UpdateFilterChipLabels()
    {
        LocationChipLabel.Text = AppText.T("Search_Filter_Location");
        NearbyChipLabel.Text = _model.GetNearbyFilterTitle();
        PriceChipLabel.Text = _model.GetPriceFilterTitle();
        TypeChipLabel.Text = _model.GetTypeFilterTitle();
        PriceRangeLabel.Text = "⌂ " + _model.GetPriceRangeSummaryText();
    }

    private void LoadMapHtml()
    {
        var poisJson = JsonSerializer.Serialize(_model.MapPois);
        var viewDetailsTextJson = JsonSerializer.Serialize(AppText.T("Search_ViewDetails"));
        var streetLabelJson = JsonSerializer.Serialize("Đường Hà Tôn Quyền");

        var userLocationJson = JsonSerializer.Serialize(new
        {
            hasLocation = _model.HasUserLocation,
            latitude = _model.UserLatitude,
            longitude = _model.UserLongitude
        });

        var html = """
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

    <style>
        html, body, #map {
            height: 100%;
            width: 100%;
            margin: 0;
            padding: 0;
        }

        .street-label div {
            background: rgba(255, 255, 255, 0.94);
            color: #111111;
            font-weight: 800;
            font-size: 12px;
            padding: 5px 10px;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.20);
            white-space: nowrap;
            text-align: center;
            border: 1px solid rgba(0,0,0,0.08);
        }

        .poi-popup {
            min-width: 160px;
            font-family: Arial, sans-serif;
        }

        .poi-popup-title {
            font-weight: 800;
            font-size: 13px;
            margin-bottom: 4px;
            color: #111111;
        }

        .poi-popup-address {
            font-size: 11px;
            color: #555555;
            margin-bottom: 8px;
        }

        .poi-popup-link {
            display: inline-block;
            background: #F97316;
            color: white !important;
            text-decoration: none;
            padding: 6px 10px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 700;
        }
    </style>
</head>

<body>
    <div id="map"></div>

    <script>
        const pois = __POIS_JSON__;
        const viewDetailsText = __VIEW_DETAILS_TEXT_JSON__;
        const streetLabel = __STREET_LABEL_JSON__;
        const userLocation = __USER_LOCATION_JSON__;

        const haTonQuyenCenter = [10.7568, 106.6497];

        let initialCenter = haTonQuyenCenter;

        if (userLocation && userLocation.hasLocation) {
            const userLat = Number(userLocation.latitude);
            const userLng = Number(userLocation.longitude);

            if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
                initialCenter = [userLat, userLng];
            }
        }

        const map = L.map('map', {
            zoomControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false,
            touchZoom: false
        }).setView(initialCenter, 17);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const haTonQuyenLine = [
            [10.7553, 106.6488],
            [10.7560, 106.6492],
            [10.7568, 106.6497],
            [10.7575, 106.6501],
            [10.7582, 106.6506]
        ];

        L.polyline(haTonQuyenLine, {
            color: '#F97316',
            weight: 4,
            opacity: 0.75
        }).addTo(map);

        L.marker(haTonQuyenCenter, {
            interactive: false,
            icon: L.divIcon({
                className: 'street-label',
                html: '<div>' + streetLabel + '</div>',
                iconSize: [160, 30],
                iconAnchor: [80, 15]
            })
        }).addTo(map);

        const validPois = [];

        if (userLocation && userLocation.hasLocation) {
            const userLat = Number(userLocation.latitude);
            const userLng = Number(userLocation.longitude);

            if (Number.isFinite(userLat) && Number.isFinite(userLng)) {
                validPois.push([userLat, userLng]);

                L.circleMarker([userLat, userLng], {
                    radius: 8,
                    color: '#2563EB',
                    weight: 2,
                    fillColor: '#60A5FA',
                    fillOpacity: 0.95
                }).addTo(map);
            }
        }

        pois.forEach(function(poi) {
            const lat = Number(poi.Latitude);
            const lng = Number(poi.Longitude);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                return;
            }

            if (lat === 0 || lng === 0) {
                return;
            }

            validPois.push([lat, lng]);

            const marker = L.marker([lat, lng]).addTo(map);

            const name = poi.Name || '';
            const address = poi.Address || '';
            const id = poi.Id || '';

            marker.bindPopup(
                '<div class="poi-popup">' +
                    '<div class="poi-popup-title">' + escapeHtml(name) + '</div>' +
                    '<div class="poi-popup-address">' + escapeHtml(address) + '</div>' +
                    '<a class="poi-popup-link" href="app://poi/' + encodeURIComponent(id) + '">' +
                        escapeHtml(viewDetailsText) +
                    '</a>' +
                '</div>'
            );

            marker.on('click', function() {
                window.location.href = 'app://select/' + encodeURIComponent(id);
            });
        });

        if (validPois.length > 0) {
            const bounds = L.latLngBounds(validPois);

            map.fitBounds(bounds, {
                padding: [28, 28],
                maxZoom: 18
            });
        } else {
            map.setView(initialCenter, 17);
        }

        setTimeout(function() {
            map.invalidateSize();
        }, 300);

        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
        }
    </script>
</body>
</html>
""";

        string htmlText = html
            .Replace("__POIS_JSON__", poisJson)
            .Replace("__VIEW_DETAILS_TEXT_JSON__", viewDetailsTextJson)
            .Replace("__STREET_LABEL_JSON__", streetLabelJson)
            .Replace("__USER_LOCATION_JSON__", userLocationJson);

        MapWebView.Source = new HtmlWebViewSource
        {
            Html = htmlText
        };
    }

    private void OnMapNavigating(object sender, WebNavigatingEventArgs e)
    {
        if (string.IsNullOrWhiteSpace(e.Url))
            return;

        if (e.Url.StartsWith("app://select/"))
        {
            e.Cancel = true;

            string id = Uri.UnescapeDataString(
                e.Url.Replace("app://select/", string.Empty));

            var poi = _model.MapPois.FirstOrDefault(x => x.Id == id);

            if (poi != null)
                _model.SelectPoi(poi);

            return;
        }

        if (e.Url.StartsWith("app://poi/"))
        {
            e.Cancel = true;

            string id = Uri.UnescapeDataString(
                e.Url.Replace("app://poi/", string.Empty));

            var poi = _model.MapPois.FirstOrDefault(x => x.Id == id);

            if (poi == null)
                return;

            _model.SelectPoi(poi);

            MainThread.BeginInvokeOnMainThread(async () =>
            {
                await Navigation.PushAsync(new PoiDetailPage(poi));
            });
        }
    }

    private void OnLocationChipTapped(object sender, TappedEventArgs e)
    {
        _model.SelectFilter("location");
        UpdateFilterChipLabels();
        LoadMapHtml();
    }

    private async void OnNearbyChipTapped(object sender, TappedEventArgs e)
    {
        string cancel = AppText.T("Common_Cancel");
        string useGps = TextOrDefault("Search_Filter_Nearby_Gps", "Use current GPS");
        string pickOnMap = TextOrDefault("Search_Filter_Nearby_Pick", "Pick a point on map");
        string clearNearby = TextOrDefault("Search_Filter_Nearby_Clear", "Clear nearby");

        string action = await DisplayActionSheet(
            TextOrDefault("Search_Filter_Nearby", "Nearby"),
            cancel,
            null,
            useGps,
            pickOnMap,
            clearNearby);

        if (string.IsNullOrWhiteSpace(action) || action == cancel)
            return;

        if (action == useGps)
        {
            await _model.ApplyNearbyFromGpsAsync();
            UpdateFilterChipLabels();
            LoadMapHtml();
            return;
        }

        if (action == pickOnMap)
        {
            await Navigation.PushAsync(new FullMapPage(_model, true));
            return;
        }

        if (action == clearNearby)
        {
            _model.ClearNearbyFilter();
            UpdateFilterChipLabels();
            LoadMapHtml();
        }
    }

    private async void OnPriceChipTapped(object sender, TappedEventArgs e)
    {
        string cancel = AppText.T("Common_Cancel");
        string all = TextOrDefault("Common_All", "Tất cả");

        string under50 = "Dưới 50.000đ";
        string from50To100 = "50.000đ - 100.000đ";
        string over100 = "Trên 100.000đ";

        string action = await DisplayActionSheet(
            AppText.T("Search_Filter_Price"),
            cancel,
            null,
            all,
            under50,
            from50To100,
            over100);

        if (string.IsNullOrWhiteSpace(action) || action == cancel)
            return;

        string key = action switch
        {
            var x when x == under50 => "under50",
            var x when x == from50To100 => "50to100",
            var x when x == over100 => "over100",
            _ => "all"
        };

        _model.ApplyPriceFilter(key);
        UpdateFilterChipLabels();
        LoadMapHtml();
    }

    private async void OnTypeChipTapped(object sender, TappedEventArgs e)
    {
        string cancel = AppText.T("Common_Cancel");
        string all = TextOrDefault("Common_All", "Tất cả");

        var options = new List<(string Key, string Label)>
        {
            ("all", all),
            ("mon-hoa", AppText.T("Main_Category_ChineseCuisine")),
            ("mi-hu-tieu", AppText.T("Main_Category_Noodles")),
            ("lau", AppText.T("Main_Category_Hotpot")),
            ("nuoc-uong", AppText.T("Main_Category_Drink")),
            ("dimsum", AppText.T("Main_Category_Dimsum"))
        };

        string action = await DisplayActionSheet(
            AppText.T("Search_Filter_Type"),
            cancel,
            null,
            options.Select(x => x.Label).ToArray());

        if (string.IsNullOrWhiteSpace(action) || action == cancel)
            return;

        var selected = options.FirstOrDefault(x => x.Label == action);

        if (string.IsNullOrWhiteSpace(selected.Key))
            return;

        _model.ApplyTypeFilter(selected.Key);
        UpdateFilterChipLabels();
        LoadMapHtml();
    }

    private async void OnViewPoiDetailTapped(object sender, TappedEventArgs e)
    {
        if (_model.SelectedPoi is null)
            return;

        await Navigation.PushAsync(new PoiDetailPage(_model.SelectedPoi));
    }

    private async void OnPlaceTapped(object sender, TappedEventArgs e)
    {
        if (sender is not BindableObject bindable)
            return;

        if (bindable.BindingContext is not SearchPlaceItem place)
            return;

        var poi = _model.MapPois.FirstOrDefault(x => x.Id == place.Id);

        if (poi == null)
            return;

        _model.SelectPoi(poi);

        await Navigation.PushAsync(new PoiDetailPage(poi));
    }

    private async void OnOpenFullMapTapped(object sender, TappedEventArgs e)
    {
        await Navigation.PushAsync(new FullMapPage(_model));
    }

    private static string TextOrDefault(string key, string fallback)
    {
        string value = AppText.T(key);

        return string.IsNullOrWhiteSpace(value) || value == key
            ? fallback
            : value;
    }
}