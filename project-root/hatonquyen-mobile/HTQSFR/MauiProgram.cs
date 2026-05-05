using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;
using Syncfusion.Maui.Toolkit.Hosting;
using Microsoft.Maui.Handlers;
using HTQSFR.Pages;
using HTQSFR.PageModels;
using HTQSFR.Services;
using Plugin.Maui.Audio;

#if ANDROID
using Android.Content.Res;
#endif

namespace HTQSFR
{
    public static class MauiProgram
    {
        public static MauiApp CreateMauiApp()
        {
            var builder = MauiApp.CreateBuilder();

            builder
                .UseMauiApp<App>()
                .UseMauiCommunityToolkit()
                .ConfigureSyncfusionToolkit()
                .AddAudio()
                .ConfigureMauiHandlers(handlers =>
                {
#if WINDOWS
                    Microsoft.Maui.Controls.Handlers.Items.CollectionViewHandler.Mapper.AppendToMapping("KeyboardAccessibleCollectionView", (handler, view) =>
                    {
                        handler.PlatformView.SingleSelectionFollowsFocus = false;
                    });
#endif
                })
                .ConfigureFonts(fonts =>
                {
                    fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                    fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
                    fonts.AddFont("SegoeUI-Semibold.ttf", "SegoeSemibold");
                    fonts.AddFont("FluentSystemIcons-Regular.ttf", FluentUI.FontFamily);
                });

#if ANDROID
            EntryHandler.Mapper.AppendToMapping("NoUnderline", (handler, view) =>
            {
                handler.PlatformView.Background = null;
                handler.PlatformView.BackgroundTintList =
                    ColorStateList.ValueOf(Android.Graphics.Color.Transparent);
                handler.PlatformView.SetBackgroundColor(Android.Graphics.Color.Transparent);
            });
#endif

#if DEBUG
            builder.Logging.AddDebug();
            builder.Services.AddLogging(configure => configure.AddDebug());
#endif

            builder.Services.AddSingleton<OfflineMapPackService>();
            builder.Services.AddSingleton<PoiAudioPlaybackService>();
            builder.Services.AddSingleton<PoiAudioPlaybackQueueService>();

            builder.Services.AddTransient<SearchPage>();
            builder.Services.AddTransient<SavedPage>();
            builder.Services.AddTransient<ProfilePage>();
            builder.Services.AddTransient<MainPageModel>();
            builder.Services.AddTransient<MainPage>();

            return builder.Build();
        }
    }
}