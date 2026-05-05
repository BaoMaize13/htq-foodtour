namespace HTQSFR.Models
{
    public class SavedFoodItem
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string RatingText { get; set; } = string.Empty;
        public string PriceText { get; set; } = string.Empty;
        public string TimeText { get; set; } = string.Empty;
        public string BadgeText { get; set; } = string.Empty;
        public bool IsFavorite { get; set; } = true;
    }
}