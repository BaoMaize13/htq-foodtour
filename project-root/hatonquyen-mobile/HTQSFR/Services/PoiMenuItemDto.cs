using System.Text.Json.Serialization;

namespace HTQSFR.Services;

public sealed class PoiMenuItemDto
{
    private List<string> _images = new();
    private string _priceText = string.Empty;
    private decimal _price;

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

    [JsonIgnore]
    public string Description
    {
        get => Name;
        set { }
    }

    [JsonPropertyName("price")]
    public decimal Price
    {
        get => _price;
        set
        {
            _price = value;

            if (string.IsNullOrWhiteSpace(_priceText))
            {
                _priceText = $"{_price:N0}đ";
            }
        }
    }

    [JsonIgnore]
    public string PriceText
    {
        get => string.IsNullOrWhiteSpace(_priceText)
            ? $"{Price:N0}đ"
            : _priceText;
        set => _priceText = value ?? string.Empty;
    }

    [JsonPropertyName("imageUrl")]
    public string ImageUrl { get; set; } = string.Empty;

    [JsonPropertyName("images")]
    public List<string> Images
    {
        get
        {
            if (_images.Count > 0)
                return _images;

            if (!string.IsNullOrWhiteSpace(ImageUrl))
                return new List<string> { ImageUrl };

            return new List<string>();
        }
        set => _images = value ?? new List<string>();
    }

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("itemCode")]
    public string ItemCode { get; set; } = string.Empty;

    [JsonPropertyName("poiId")]
    public string PoiId { get; set; } = string.Empty;
}

public sealed class PoiMenuListResponseDto
{
    [JsonPropertyName("data")]
    public List<PoiMenuItemDto>? Data { get; set; }
}