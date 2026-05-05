using Microsoft.Maui.Storage;

namespace HTQSFR
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();

            bool isDarkMode = Preferences.Default.Get("IsDarkMode", false);

            UserAppTheme = isDarkMode
                ? AppTheme.Dark
                : AppTheme.Light;
        }

        protected override Window CreateWindow(IActivationState? activationState)
        {
            return new Window(new AppShell());
        }
    }
}