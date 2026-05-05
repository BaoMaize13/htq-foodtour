using System.Text.Json.Serialization;

namespace HTQSFR.Services;

public sealed class PoiAudioDto
{
    [JsonPropertyName("poiId")]
    public string PoiId { get; set; } = string.Empty;

    [JsonPropertyName("language")]
    public string Language { get; set; } = string.Empty;

    [JsonPropertyName("hasAudioAsset")]
    public bool HasAudioAsset { get; set; }

    [JsonPropertyName("audioUrl")]
    public string AudioUrl { get; set; } = string.Empty;

    [JsonPropertyName("audioSourceType")]
    public string AudioSourceType { get; set; } = string.Empty;

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("narrationId")]
    public string NarrationId { get; set; } = string.Empty;

    [JsonPropertyName("narrationTitle")]
    public string NarrationTitle { get; set; } = string.Empty;

    [JsonPropertyName("speechText")]
    public string SpeechText { get; set; } = string.Empty;

    [JsonPropertyName("isFallbackText")]
    public bool IsFallbackText { get; set; }

    [JsonPropertyName("featuredMenu")]
    public List<PoiMenuItemDto> FeaturedMenu { get; set; } = new();

    [JsonPropertyName("reviewSummary")]
    public PoiAudioReviewSummaryDto? ReviewSummary { get; set; }
}

public sealed class PoiAudioReviewSummaryDto
{
    [JsonPropertyName("averageRating")]
    public double AverageRating { get; set; }

    [JsonPropertyName("totalReviews")]
    public int TotalReviews { get; set; }
}

public sealed class PoiAudioResponseDto
{
    [JsonPropertyName("data")]
    public PoiAudioDto? Data { get; set; }
}