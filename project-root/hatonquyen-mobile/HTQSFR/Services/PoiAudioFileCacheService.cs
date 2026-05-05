using System.Security.Cryptography;
using System.Text;
using HTQSFR.Utilities;
using Microsoft.Maui.Storage;

namespace HTQSFR.Services;

public sealed class PoiAudioFileCacheService
{
    private const string AudioCacheFolderName = "poi_audio_cache";

    private static readonly HttpClient HttpClient = new();

    public async Task<string?> GetOrCacheAudioFileAsync(string poiId, PoiAudioDto? audio)
    {
        if (string.IsNullOrWhiteSpace(poiId) ||
            audio is null ||
            string.IsNullOrWhiteSpace(audio.AudioUrl))
        {
            return null;
        }

        try
        {
            string absoluteUrl = ResolveAudioUrl(audio.AudioUrl);

            if (string.IsNullOrWhiteSpace(absoluteUrl))
                return null;

            string language = string.IsNullOrWhiteSpace(audio.Language)
                ? AppText.CurrentLanguageCode
                : audio.Language;

            if (string.IsNullOrWhiteSpace(language))
                language = "vi";

            string folderPath = Path.Combine(
                FileSystem.AppDataDirectory,
                AudioCacheFolderName);

            Directory.CreateDirectory(folderPath);

            string fileExtension = GetFileExtensionFromUrl(absoluteUrl);
            string fileName = BuildFileName(poiId, language, absoluteUrl, fileExtension);
            string filePath = Path.Combine(folderPath, fileName);

            if (File.Exists(filePath))
            {
                var info = new FileInfo(filePath);

                if (info.Exists && info.Length > 0)
                    return filePath;
            }

            string tempPath = filePath + ".download";

            try
            {
                using var response = await HttpClient.GetAsync(
                    absoluteUrl,
                    HttpCompletionOption.ResponseHeadersRead);

                if (!response.IsSuccessStatusCode)
                    return null;

                await using var remoteStream = await response.Content.ReadAsStreamAsync();
                await using var localStream = File.Create(tempPath);

                await remoteStream.CopyToAsync(localStream);
                await localStream.FlushAsync();

                if (File.Exists(filePath))
                    File.Delete(filePath);

                File.Move(tempPath, filePath);

                return filePath;
            }
            finally
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
            }
        }
        catch
        {
            return null;
        }
    }

    private static string ResolveAudioUrl(string audioUrl)
    {
        if (string.IsNullOrWhiteSpace(audioUrl))
            return string.Empty;

        if (audioUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            audioUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return audioUrl;
        }

        var apiBaseUri = new Uri(ApiConfig.BaseUrl);

        string origin = apiBaseUri.IsDefaultPort
            ? $"{apiBaseUri.Scheme}://{apiBaseUri.Host}"
            : $"{apiBaseUri.Scheme}://{apiBaseUri.Host}:{apiBaseUri.Port}";

        if (audioUrl.StartsWith("/", StringComparison.Ordinal))
            return $"{origin}{audioUrl}";

        return $"{origin}/{audioUrl}";
    }

    private static string BuildFileName(
        string poiId,
        string language,
        string audioUrl,
        string extension)
    {
        string safePoiId = SanitizeFilePart(poiId);
        string safeLanguage = SanitizeFilePart(language);
        string hash = ComputeSha256(audioUrl);

        return $"{safePoiId}_{safeLanguage}_{hash}{extension}";
    }

    private static string GetFileExtensionFromUrl(string absoluteUrl)
    {
        try
        {
            var uri = new Uri(absoluteUrl);
            string extension = Path.GetExtension(uri.LocalPath);

            if (string.IsNullOrWhiteSpace(extension))
                return ".mp3";

            if (extension.Length > 8)
                return ".mp3";

            return extension;
        }
        catch
        {
            return ".mp3";
        }
    }

    private static string SanitizeFilePart(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "unknown";

        var invalidChars = Path.GetInvalidFileNameChars();
        var builder = new StringBuilder(value.Length);

        foreach (char c in value)
        {
            builder.Append(invalidChars.Contains(c) ? '_' : c);
        }

        return builder.ToString().Replace(' ', '_');
    }

    private static string ComputeSha256(string value)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(value);
        byte[] hashBytes = SHA256.HashData(bytes);

        var builder = new StringBuilder(hashBytes.Length * 2);

        foreach (byte b in hashBytes)
            builder.Append(b.ToString("x2"));

        return builder.ToString();
    }
}