using System.Text.Json.Serialization;

namespace HTQSFR.Services;

public sealed class PoiDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string MongoId
    {
        get => Id;
        set => Id = value ?? string.Empty;
    }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("address")]
    public string Address { get; set; } = string.Empty;

    [JsonPropertyName("shortDescription")]
    public string ShortDescription { get; set; } = string.Empty;

    [JsonPropertyName("fullDescription")]
    public string FullDescription { get; set; } = string.Empty;

    [JsonIgnore]
    public string Description
    {
        get => !string.IsNullOrWhiteSpace(FullDescription) ? FullDescription : ShortDescription;
        set => FullDescription = value ?? string.Empty;
    }

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [JsonPropertyName("images")]
    public List<string> Images { get; set; } = new();

    [JsonPropertyName("lat")]
    public double Latitude { get; set; }

    [JsonPropertyName("lng")]
    public double Longitude { get; set; }

    [JsonPropertyName("geofenceRadius")]
    public double GeofenceRadius { get; set; }

    [JsonPropertyName("audioPriority")]
    public int AudioPriority { get; set; }

    [JsonPropertyName("audioUrl")]
    public string AudioUrl { get; set; } = string.Empty;

    [JsonIgnore]
    public string AudioUrlSnake
    {
        get => AudioUrl;
        set => AudioUrl = value ?? string.Empty;
    }

    [JsonPropertyName("badgeText")]
    public string BadgeText { get; set; } = string.Empty;

    [JsonPropertyName("timeText")]
    public string TimeText { get; set; } = string.Empty;

    [JsonPropertyName("infoTags")]
    public List<string> InfoTags { get; set; } = new();

    [JsonPropertyName("isFavorite")]
    public bool IsFavorite { get; set; }

    [JsonPropertyName("averageRating")]
    public double AverageRating { get; set; }

    [JsonPropertyName("totalReviews")]
    public int TotalReviews { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public PoiCategoryDto? Category { get; set; }

    [JsonIgnore]
    public string RatingText => AverageRating <= 0 ? "0.0" : AverageRating.ToString("0.0");
}

public sealed class PoiCategoryDto
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonIgnore]
    public string MongoId
    {
        get => Id;
        set => Id = value ?? string.Empty;
    }

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("slug")]
    public string Slug { get; set; } = string.Empty;
}

public sealed class PoiListResponseDto
{
    [JsonPropertyName("data")]
    public List<PoiDto>? Data { get; set; }
}

public sealed class PoiSingleResponseDto
{
    [JsonPropertyName("data")]
    public PoiDto? Data { get; set; }
}