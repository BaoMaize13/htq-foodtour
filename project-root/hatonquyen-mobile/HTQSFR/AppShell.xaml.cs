using CommunityToolkit.Maui.Alerts;
using CommunityToolkit.Maui.Core;
using Font = Microsoft.Maui.Font;
using HTQSFR.Pages;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;
using System.Reflection;

namespace HTQSFR
{
    public partial class AppShell : Shell
    {
        private bool _languageLoaded;
        private bool _mapPackInitStarted;

        public AppShell()
        {
            InitializeComponent();

            Routing.RegisterRoute(nameof(LoginPage), typeof(LoginPage));
            Routing.RegisterRoute(nameof(RegisterPage), typeof(RegisterPage));
            Routing.RegisterRoute(nameof(MainPage), typeof(MainPage));
            Routing.RegisterRoute(nameof(PoiDetailPage), typeof(PoiDetailPage));
            Routing.RegisterRoute(nameof(PoiReviewsPage), typeof(PoiReviewsPage));
            Routing.RegisterRoute(nameof(FullMapPage), typeof(FullMapPage));

            AppText.LanguageChanged += OnLanguageChanged;
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();

            if (_languageLoaded)
                return;

            _languageLoaded = true;

            await AppText.InitializeAsync();
            await SyncLanguageFromBackendAsync();
            ApplyLanguage();

            StartMapPackInitialization();
        }

        private void OnLanguageChanged(object? sender, EventArgs e)
        {
            HotsetService.ClearAll();

            MainThread.BeginInvokeOnMainThread(() =>
            {
                ApplyLanguage();
                ApplyLanguageToVisiblePage();
            });
        }

        private void StartMapPackInitialization()
        {
            if (_mapPackInitStarted)
                return;

            _mapPackInitStarted = true;

            _ = Task.Run(async () =>
            {
                try
                {
                    var service = new OfflineMapPackService();
                    await service.EnsureLatestPackAsync();
                }
                catch
                {
                }
            });
        }

        private async Task SyncLanguageFromBackendAsync()
        {
            try
            {
                bool isGuestMode = Preferences.Default.Get("IsGuestMode", false);
                if (isGuestMode)
                    return;

                string? token = await AuthSessionService.GetAccessTokenAsync();

                if (string.IsNullOrWhiteSpace(token))
                    return;

                var preferenceService = new UserPreferenceService();

                string? backendLanguage =
                    await preferenceService.GetPreferredLanguageAsync(token);

                if (string.IsNullOrWhiteSpace(backendLanguage))
                    return;

                if (!string.Equals(
                        backendLanguage,
                        AppText.CurrentLanguageCode,
                        StringComparison.OrdinalIgnoreCase))
                {
                    await AppText.SetLanguageAsync(backendLanguage);
                }
            }
            catch
            {
            }
        }

        public void ApplyLanguage()
        {
            FlowDirection = AppText.GetFlowDirection();

            HomeTab.Title = AppText.T("Tab_Home");
            SearchTab.Title = AppText.T("Tab_Search");
            SavedTab.Title = AppText.T("Tab_Saved");
            ProfileTab.Title = AppText.T("Tab_Profile");
        }

        private void ApplyLanguageToVisiblePage()
        {
            try
            {
                Page? page = CurrentPage;

                if (page is null)
                    return;

                page.FlowDirection = AppText.GetFlowDirection();
                InvokeLanguageRefresh(page);

                if (page.BindingContext is not null)
                    InvokeLanguageRefresh(page.BindingContext);
            }
            catch
            {
                // Không để lỗi refresh ngôn ngữ làm crash Shell.
            }
        }

        private static void InvokeLanguageRefresh(object target)
        {
            const BindingFlags flags =
                BindingFlags.Instance |
                BindingFlags.Public |
                BindingFlags.NonPublic;

            string[] methodNames =
            {
                "ApplyLanguage",
                "RefreshLanguage",
                "ReloadLanguage",
                "OnLanguageChanged"
            };

            Type type = target.GetType();

            foreach (string methodName in methodNames)
            {
                MethodInfo? method = type.GetMethod(methodName, flags, binder: null, Type.EmptyTypes, modifiers: null);

                if (method is null)
                    continue;

                method.Invoke(target, null);
                return;
            }
        }

        public static async Task DisplaySnackbarAsync(string message)
        {
            CancellationTokenSource cancellationTokenSource = new();

            var snackbarOptions = new SnackbarOptions
            {
                BackgroundColor = Color.FromArgb("#FF3300"),
                TextColor = Colors.White,
                ActionButtonTextColor = Colors.Yellow,
                CornerRadius = new CornerRadius(0),
                Font = Font.SystemFontOfSize(18),
                ActionButtonFont = Font.SystemFontOfSize(14)
            };

            var snackbar = Snackbar.Make(message, visualOptions: snackbarOptions);

            await snackbar.Show(cancellationTokenSource.Token);
        }

        public static async Task DisplayToastAsync(string message)
        {
            if (OperatingSystem.IsWindows())
                return;

            var toast = Toast.Make(message, textSize: 18);
            var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));

            await toast.Show(cts.Token);
        }
    }
}