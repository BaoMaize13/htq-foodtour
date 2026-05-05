using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;

namespace HTQSFR.Services;

public sealed class OfflineMapPackService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly HttpClient _httpClient = new();

    public async Task<MapsManifestDto?> GetManifestAsync()
    {
        try
        {
            string url = new Uri(new Uri(ApiConfig.MapsBaseUrl), "offline-manifest").ToString();

            using var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return null;

            string json = await response.Content.ReadAsStringAsync();

            if (string.IsNullOrWhiteSpace(json))
                return null;

            var envelope = JsonSerializer.Deserialize<MapsManifestEnvelope>(json, JsonOptions);

            if (envelope?.Data is not null)
                return envelope.Data;

            return JsonSerializer.Deserialize<MapsManifestDto>(json, JsonOptions);
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> EnsureLatestPackAsync()
    {
        try
        {
            var manifest = await GetManifestAsync();

            if (manifest is null || string.IsNullOrWhiteSpace(manifest.LatestPackVersion))
                return false;

            var latestPack = manifest.Packs.FirstOrDefault(x =>
                string.Equals(x.Version, manifest.LatestPackVersion, StringComparison.OrdinalIgnoreCase));

            if (latestPack is null || latestPack.Files.Count == 0)
                return false;

            string root = GetPackRootDirectory();
            Directory.CreateDirectory(root);

            string versionRoot = Path.Combine(root, latestPack.Version);
            Directory.CreateDirectory(versionRoot);

            foreach (var file in latestPack.Files)
            {
                bool ok = await DownloadAndVerifyFileAsync(versionRoot, file);

                if (!ok)
                {
                    MapConfig.SetActivePackReady(false);
                    return false;
                }
            }

            MapConfig.SetActivePackVersion(latestPack.Version);
            MapConfig.SetActivePackReady(true);

            if (Enum.TryParse<MapMode>(manifest.DefaultMode, true, out var defaultMode))
            {
                if (MapConfig.GetPreferredMode() == MapMode.Hybrid)
                    MapConfig.SetPreferredMode(defaultMode);
            }

            return true;
        }
        catch
        {
            MapConfig.SetActivePackReady(false);
            return false;
        }
    }

    public string GetPackRootDirectory()
    {
        return Path.Combine(FileSystem.AppDataDirectory, "offline-map-packs");
    }

    public string GetActivePackDirectory()
    {
        string version = MapConfig.GetActivePackVersion();

        return string.IsNullOrWhiteSpace(version)
            ? string.Empty
            : Path.Combine(GetPackRootDirectory(), version);
    }

    private async Task<bool> DownloadAndVerifyFileAsync(
        string versionRoot,
        MapPackFileDto file)
    {
        if (string.IsNullOrWhiteSpace(file.Path) ||
            string.IsNullOrWhiteSpace(file.Url))
        {
            return false;
        }

        string relativePath = file.Path
            .Replace('/', Path.DirectorySeparatorChar)
            .Replace('\\', Path.DirectorySeparatorChar);

        string localPath = Path.Combine(versionRoot, relativePath);
        string? localDirectory = Path.GetDirectoryName(localPath);

        if (!string.IsNullOrWhiteSpace(localDirectory))
            Directory.CreateDirectory(localDirectory);

        if (File.Exists(localPath))
        {
            if (await VerifySha256Async(localPath, file.Sha256))
                return true;
        }

        string absoluteUrl = ToAbsoluteUrl(file.Url);
        string tempPath = localPath + ".download";

        try
        {
            using var response = await _httpClient.GetAsync(
                absoluteUrl,
                HttpCompletionOption.ResponseHeadersRead);

            if (!response.IsSuccessStatusCode)
                return false;

            await using (var remote = await response.Content.ReadAsStreamAsync())
            await using (var local = File.Create(tempPath))
            {
                await remote.CopyToAsync(local);
                await local.FlushAsync();
            }

            bool checksumValid = await VerifySha256Async(tempPath, file.Sha256);

            if (!checksumValid)
            {
                File.Delete(tempPath);
                return false;
            }

            if (File.Exists(localPath))
                File.Delete(localPath);

            File.Move(tempPath, localPath);

            return true;
        }
        catch
        {
            if (File.Exists(tempPath))
            {
                try
                {
                    File.Delete(tempPath);
                }
                catch
                {
                }
            }

            return false;
        }
    }

    private static async Task<bool> VerifySha256Async(string filePath, string expectedSha256)
    {
        if (string.IsNullOrWhiteSpace(expectedSha256))
            return true;

        if (!File.Exists(filePath))
            return false;

        await using var stream = File.OpenRead(filePath);
        byte[] hashBytes = await SHA256.HashDataAsync(stream);
        string actual = Convert.ToHexString(hashBytes).ToLowerInvariant();

        return string.Equals(
            actual,
            expectedSha256.Trim().ToLowerInvariant(),
            StringComparison.Ordinal);
    }

    private static string ToAbsoluteUrl(string url)
    {
        if (url.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return url;
        }

        if (url.StartsWith("/", StringComparison.Ordinal))
            return $"{ApiConfig.Origin}{url}";

        return new Uri(new Uri(ApiConfig.MapsBaseUrl), url).ToString();
    }
}

public sealed class MapsManifestEnvelope
{
    [JsonPropertyName("data")]
    public MapsManifestDto? Data { get; set; }
}

public sealed class MapsManifestDto
{
    [JsonPropertyName("defaultMode")]
    public string DefaultMode { get; set; } = "hybrid";

    [JsonPropertyName("latestPackVersion")]
    public string LatestPackVersion { get; set; } = string.Empty;

    [JsonPropertyName("cloudStyleUrl")]
    public string CloudStyleUrl { get; set; } = "/api/maps/styles/cloud/style.json";

    [JsonPropertyName("packs")]
    public List<MapPackDto> Packs { get; set; } = new();
}

public sealed class MapPackDto
{
    [JsonPropertyName("version")]
    public string Version { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("files")]
    public List<MapPackFileDto> Files { get; set; } = new();
}

public sealed class MapPackFileDto
{
    [JsonPropertyName("path")]
    public string Path { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonPropertyName("sha256")]
    public string Sha256 { get; set; } = string.Empty;

    [JsonPropertyName("size")]
    public long Size { get; set; }
}