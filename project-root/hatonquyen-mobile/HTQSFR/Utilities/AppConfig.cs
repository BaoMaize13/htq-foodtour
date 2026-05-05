namespace HTQSFR.Utilities;

public static class ApiConfig
{
#if ANDROID || IOS
    public const string BaseUrl = "http://192.168.1.19:5000/api/";
#else
    public const string BaseUrl = "http://localhost:5000/api/";
#endif
    public static string Origin
    {
        get
        {
            var uri = new Uri(BaseUrl);

            return uri.IsDefaultPort
                ? $"{uri.Scheme}://{uri.Host}"
                : $"{uri.Scheme}://{uri.Host}:{uri.Port}";
        }
    }

    public static string MapsBaseUrl =>
        new Uri(new Uri(BaseUrl), "maps/").ToString();
}