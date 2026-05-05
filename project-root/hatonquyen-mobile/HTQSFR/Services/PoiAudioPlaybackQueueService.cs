using HTQSFR.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Maui.Controls;

namespace HTQSFR.Services;

public sealed class PoiAudioPlaybackQueueService
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private readonly Queue<PoiMapItem> _queue = new();
    private readonly HashSet<string> _queuedIds = new();

    private readonly PoiAudioPlaybackService _playbackService =
        ResolveService<PoiAudioPlaybackService>();

    private bool _isRunning;

    public async Task ReplaceQueueAsync(IEnumerable<PoiMapItem> pois)
    {
        await _gate.WaitAsync();

        try
        {
            _queue.Clear();
            _queuedIds.Clear();

            foreach (var poi in pois)
            {
                if (string.IsNullOrWhiteSpace(poi.Id))
                    continue;

                if (_queuedIds.Add(poi.Id))
                    _queue.Enqueue(poi);
            }
        }
        finally
        {
            _gate.Release();
        }

        await _playbackService.StopAsync();
        StartWorkerIfNeeded();
    }

    public async Task StopAsync()
    {
        await _gate.WaitAsync();

        try
        {
            _queue.Clear();
            _queuedIds.Clear();
        }
        finally
        {
            _gate.Release();
        }

        await _playbackService.StopAsync();
    }

    private void StartWorkerIfNeeded()
    {
        bool shouldStart = false;

        _gate.Wait();
        try
        {
            if (_isRunning)
                return;

            _isRunning = true;
            shouldStart = true;
        }
        finally
        {
            _gate.Release();
        }

        if (shouldStart)
            _ = Task.Run(ProcessQueueAsync);
    }

    private async Task ProcessQueueAsync()
    {
        try
        {
            while (true)
            {
                PoiMapItem? next = null;

                await _gate.WaitAsync();
                try
                {
                    if (_queue.Count == 0)
                    {
                        _isRunning = false;
                        return;
                    }

                    next = _queue.Dequeue();

                    if (!string.IsNullOrWhiteSpace(next.Id))
                        _queuedIds.Remove(next.Id);
                }
                finally
                {
                    _gate.Release();
                }

                if (next is null)
                    continue;

                string fallbackSpeech = BuildFallbackSpeech(next);

                await _playbackService.PlayPoiAsync(
                    next.Id,
                    string.IsNullOrWhiteSpace(fallbackSpeech) ? null : fallbackSpeech);
            }
        }
        finally
        {
            await _gate.WaitAsync();
            try
            {
                _isRunning = false;
            }
            finally
            {
                _gate.Release();
            }
        }
    }

    private static string BuildFallbackSpeech(PoiMapItem poi)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(poi.Name))
            parts.Add(poi.Name.Trim());

        if (!string.IsNullOrWhiteSpace(poi.ShortDescription))
            parts.Add(poi.ShortDescription.Trim());
        else if (!string.IsNullOrWhiteSpace(poi.FullDescription))
            parts.Add(poi.FullDescription.Trim());

        return string.Join(". ", parts.Where(x => !string.IsNullOrWhiteSpace(x))).Trim();
    }

    private static T ResolveService<T>() where T : class, new()
    {
        return Application.Current?.Handler?.MauiContext?.Services.GetService<T>()
               ?? new T();
    }
}