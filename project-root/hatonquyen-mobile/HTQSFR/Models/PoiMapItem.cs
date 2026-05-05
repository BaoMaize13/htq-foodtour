using System;
using System.Collections.Generic;
using System.Linq;

namespace HTQSFR.Models;

public class PoiMapItem
{
    private const string DefaultPoiImage = "poi_placeholder.png";

    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public double Latitude { get; set; }
    public double Longitude { get; set; }

    public string RatingText { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public List<string> Images { get; set; } = new();

    public string CoverImage
    {
        get
        {
            if (!string.IsNullOrWhiteSpace(ImageUrl))
                return ImageUrl;

            string? firstImage = Images.FirstOrDefault(x => !string.IsNullOrWhiteSpace(x));

            return string.IsNullOrWhiteSpace(firstImage)
                ? DefaultPoiImage
                : firstImage;
        }
    }

    public string ShortDescription { get; set; } = string.Empty;

    public string FullDescription { get; set; } = string.Empty;

    public string Description =>
        string.IsNullOrWhiteSpace(FullDescription)
            ? ShortDescription
            : FullDescription;

    public string Category { get; set; } = string.Empty;

    public string CategorySlug { get; set; } = string.Empty;

    public string BadgeText { get; set; } = string.Empty;

    public string TimeText { get; set; } = string.Empty;

    public double AverageRating { get; set; }

    public int TotalReviews { get; set; }

    public bool IsFavorite { get; set; }

    public string AudioUrl { get; set; } = string.Empty;

    public List<string> InfoTags { get; set; } = new();

    public double DistanceKm { get; set; } = double.NaN;

    public bool HasDistance =>
        !double.IsNaN(DistanceKm) &&
        !double.IsInfinity(DistanceKm) &&
        DistanceKm != double.MaxValue;

    public string DistanceText
    {
        get
        {
            if (!HasDistance)
                return string.Empty;

            if (DistanceKm < 1)
                return $"{DistanceKm * 1000:0} m";

            return $"{DistanceKm:0.0} km";
        }
    }
}