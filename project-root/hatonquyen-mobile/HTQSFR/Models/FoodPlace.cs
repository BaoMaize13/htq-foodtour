namespace HTQSFR.Models
{
    public class FoodPlace
    {
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Meta { get; set; } = string.Empty;
        public string RatingText { get; set; } = string.Empty;
        public string PriceText { get; set; } = string.Empty;
        public string TimeText { get; set; } = string.Empty;
        public string BadgeText { get; set; } = string.Empty;
        public bool IsFavorite { get; set; }
        public List<string> InfoTags { get; set; } = new();

        public string Rating
        {
            get => RatingText;
            set => RatingText = value;
        }
    }
}