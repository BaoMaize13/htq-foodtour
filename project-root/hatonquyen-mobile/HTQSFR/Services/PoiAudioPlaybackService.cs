using System.Globalization;
using System.IO;
using HTQSFR.Utilities;
using Microsoft.Maui.Media;
using Plugin.Maui.Audio;

namespace HTQSFR.Services;

public sealed class PoiAudioPlaybackService
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly PoiService _poiService = new();
    private readonly PoiAudioFileCacheService _poiAudioFileCacheService = new();

    private CancellationTokenSource? _ttsCancellationTokenSource;
    private Stream? _backendAudioStream;
    private IAudioPlayer? _backendAudioPlayer;
    private TaskCompletionSource<bool>? _playbackCompletionSource;

    public bool IsPlaying { get; private set; }

    public async Task<bool> PlayPoiAsync(string poiId, string? fallbackSpeechText = null)
    {
        if (string.IsNullOrWhiteSpace(poiId))
            return false;

        await StopAsync();

        var audio = await _poiService.GetPoiAudioAsync(poiId);
        string speechText = !string.IsNullOrWhiteSpace(audio?.SpeechText)
            ? audio!.SpeechText
            : fallbackSpeechText ?? string.Empty;

        IsPlaying = true;

        try
        {
            bool playedBackendAudio = await TryPlayBackendAudioAsync(poiId, audio);

            if (playedBackendAudio)
                return true;

            if (string.IsNullOrWhiteSpace(speechText))
                return false;

            await SpeakWithLocalTtsAsync(speechText);
            return true;
        }
        finally
        {
            await StopAsync();
        }
    }

    public async Task StopAsync()
    {
        await _gate.WaitAsync();

        try
        {
            try
            {
                _ttsCancellationTokenSource?.Cancel();
                _ttsCancellationTokenSource?.Dispose();
                _ttsCancellationTokenSource = null;
            }
            catch
            {
            }

            try
            {
                _playbackCompletionSource?.TrySetResult(true);
                _playbackCompletionSource = null;
            }
            catch
            {
            }

            try
            {
                if (_backendAudioPlayer is not null)
                {
                    _backendAudioPlayer.Stop();
                    _backendAudioPlayer.Dispose();
                    _backendAudioPlayer = null;
                }
            }
            catch
            {
            }

            try
            {
                _backendAudioStream?.Dispose();
                _backendAudioStream = null;
            }
            catch
            {
            }

            IsPlaying = false;
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<bool> TryPlayBackendAudioAsync(string poiId, PoiAudioDto? audio)
    {
        try
        {
            if (audio is null || string.IsNullOrWhiteSpace(audio.AudioUrl))
                return false;

            string? localAudioPath =
                await _poiAudioFileCacheService.GetOrCacheAudioFileAsync(poiId, audio);

            if (string.IsNullOrWhiteSpace(localAudioPath) || !File.Exists(localAudioPath))
                return false;

            TaskCompletionSource<bool> completionSource =
                new(TaskCreationOptions.RunContinuationsAsynchronously);

            await _gate.WaitAsync();

            try
            {
                _playbackCompletionSource = completionSource;
                _backendAudioStream = File.OpenRead(localAudioPath);
                _backendAudioPlayer = AudioManager.Current.CreatePlayer(_backendAudioStream);
            }
            finally
            {
                _gate.Release();
            }

            void OnPlaybackEnded(object? sender, EventArgs e)
            {
                completionSource.TrySetResult(true);
            }

            try
            {
                _backendAudioPlayer.PlaybackEnded += OnPlaybackEnded;
                _backendAudioPlayer.Play();

                await completionSource.Task;
                return true;
            }
            finally
            {
                try
                {
                    if (_backendAudioPlayer is not null)
                        _backendAudioPlayer.PlaybackEnded -= OnPlaybackEnded;
                }
                catch
                {
                }
            }
        }
        catch
        {
            return false;
        }
    }

    private async Task SpeakWithLocalTtsAsync(string speechText)
    {
        try
        {
            await _gate.WaitAsync();

            try
            {
                _ttsCancellationTokenSource?.Dispose();
                _ttsCancellationTokenSource = new CancellationTokenSource();
            }
            finally
            {
                _gate.Release();
            }

            var options = new SpeechOptions
            {
                Locale = await GetBestTtsLocaleAsync(),
                Pitch = 1.0f,
                Volume = 1.0f
            };

            await TextToSpeech.Default.SpeakAsync(
                speechText,
                options,
                _ttsCancellationTokenSource.Token);
        }
        catch (OperationCanceledException)
        {
        }
        catch
        {
        }
    }

    private static async Task<Locale?> GetBestTtsLocaleAsync()
    {
        try
        {
            var locales = await TextToSpeech.Default.GetLocalesAsync();

            string lang = AppText.CurrentLanguageCode;

            string targetLanguage = lang switch
            {
                "zh-Hans" => "zh",
                "zh-Hant" => "zh",
                _ => lang.Split('-')[0]
            };

            return locales.FirstOrDefault(x =>
                       string.Equals(x.Language, targetLanguage, StringComparison.OrdinalIgnoreCase))
                   ?? locales.FirstOrDefault();
        }
        catch
        {
            return null;
        }
    }
}