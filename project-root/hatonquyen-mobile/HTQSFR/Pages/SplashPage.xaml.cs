using HTQSFR.Models;
using HTQSFR.Services;
using HTQSFR.Utilities;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;
using System.Collections.Generic;
using System.Linq;

namespace HTQSFR.Pages
{
    public partial class SplashPage : ContentPage
    {
        private const string LanguageKey = "selectedLanguage";

        private readonly List<LanguageOption> _languages = new()
        {
            new LanguageOption("en", "English", "Choose language", "Get Started"),
            new LanguageOption("vi", "Vietnamese", "Chọn ngôn ngữ", "Bắt đầu"),
            new LanguageOption("ja", "Japanese", "言語を選択", "開始"),
            new LanguageOption("ko", "Korean", "언어 선택", "시작하기"),
            new LanguageOption("zh-Hans", "Chinese (Simplified)", "选择语言", "开始"),
            new LanguageOption("zh-Hant", "Chinese (Traditional)", "選擇語言", "開始"),
            new LanguageOption("fr", "French", "Choisir la langue", "Commencer"),
            new LanguageOption("de", "German", "Sprache wählen", "Los geht's"),
            new LanguageOption("es", "Spanish", "Elegir idioma", "Comenzar"),
            new LanguageOption("ru", "Russian", "Выберите язык", "Начать")
        };

        private LanguageOption _selectedLanguage = null!;
        private bool _hasCheckedSession;

        public SplashPage()
        {
            InitializeComponent();

            LanguagePicker.ItemsSource = _languages.Select(x => x.Name).ToList();
            LanguageSection.IsVisible = false;
        }

        protected override async void OnAppearing()
        {
            base.OnAppearing();

            if (_hasCheckedSession)
                return;

            _hasCheckedSession = true;

            await AppText.InitializeAsync();

            DeviceSessionService.StartNewAppSession();

            string savedLanguageCode = Preferences.Get(LanguageKey, string.Empty);
            bool hasLanguage = !string.IsNullOrWhiteSpace(savedLanguageCode);

            bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

            if (isLoggedIn)
            {
                Preferences.Default.Set("IsGuestMode", false);

                if (hasLanguage)
                {
                    _selectedLanguage = _languages.FirstOrDefault(x => x.Code == savedLanguageCode)
                                        ?? _languages.First(x => x.Code == "en");
                }
                else
                {
                    _selectedLanguage = _languages.First(x => x.Code == "en");
                    Preferences.Set(LanguageKey, _selectedLanguage.Code);
                }

                await AppText.SetLanguageAsync(_selectedLanguage.Code);

                await PresenceService.StartPresenceAsync();
                await PresenceService.IdentifyCurrentSessionAsync();

                await Shell.Current.GoToAsync("//main/home");
                return;
            }

            if (hasLanguage)
            {
                _selectedLanguage = _languages.FirstOrDefault(x => x.Code == savedLanguageCode)
                                    ?? _languages.First(x => x.Code == "en");

                await AppText.SetLanguageAsync(_selectedLanguage.Code);

                Preferences.Default.Set("IsGuestMode", true);

                await PresenceService.StartPresenceAsync();

                await Shell.Current.GoToAsync("//main/home");
                return;
            }

            _selectedLanguage = _languages.First(x => x.Code == "en");
            LanguagePicker.SelectedIndex = _languages.FindIndex(x => x.Code == _selectedLanguage.Code);

            ApplyLanguage(_selectedLanguage);
            LanguageSection.IsVisible = true;
        }

        private void ApplyLanguage(LanguageOption option)
        {
            FlowDirection = option.Code is "ar" or "he"
                ? FlowDirection.RightToLeft
                : FlowDirection.LeftToRight;

            LanguageTitleLabel.Text = option.ChooseLanguageText;
            GetStartedButton.Text = option.GetStartedText;
        }

        private void OnLanguageChanged(object sender, EventArgs e)
        {
            if (LanguagePicker.SelectedIndex < 0)
                return;

            _selectedLanguage = _languages[LanguagePicker.SelectedIndex];
            ApplyLanguage(_selectedLanguage);
        }

        private async void OnGetStartedClicked(object sender, EventArgs e)
        {
            Preferences.Set(LanguageKey, _selectedLanguage.Code);
            await AppText.SetLanguageAsync(_selectedLanguage.Code);

            bool isLoggedIn = await AuthSessionService.IsLoggedInAsync();

            if (isLoggedIn)
            {
                Preferences.Default.Set("IsGuestMode", false);

                await PresenceService.StartPresenceAsync();
                await PresenceService.IdentifyCurrentSessionAsync();

                await Shell.Current.GoToAsync("//main/home");
                return;
            }

            Preferences.Default.Set("IsGuestMode", true);

            await PresenceService.StartPresenceAsync();

            await Shell.Current.GoToAsync("//main/home");
        }
    }
}