namespace HTQSFR.Controls;

public partial class FoodCardView : ContentView
{
    public FoodCardView()
    {
        InitializeComponent();
    }

    public static readonly BindableProperty TitleProperty =
        BindableProperty.Create(nameof(Title), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty ImageUrlProperty =
        BindableProperty.Create(nameof(ImageUrl), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty RatingTextProperty =
        BindableProperty.Create(nameof(RatingText), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty PriceTextProperty =
        BindableProperty.Create(nameof(PriceText), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty TimeTextProperty =
        BindableProperty.Create(nameof(TimeText), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty BadgeTextProperty =
        BindableProperty.Create(nameof(BadgeText), typeof(string), typeof(FoodCardView), string.Empty);

    public static readonly BindableProperty IsFavoriteProperty =
        BindableProperty.Create(nameof(IsFavorite), typeof(bool), typeof(FoodCardView), false, propertyChanged: OnFavoriteChanged);

    public string Title
    {
        get => (string)GetValue(TitleProperty);
        set => SetValue(TitleProperty, value);
    }

    public string ImageUrl
    {
        get => (string)GetValue(ImageUrlProperty);
        set => SetValue(ImageUrlProperty, value);
    }

    public string RatingText
    {
        get => (string)GetValue(RatingTextProperty);
        set => SetValue(RatingTextProperty, value);
    }

    public string PriceText
    {
        get => (string)GetValue(PriceTextProperty);
        set => SetValue(PriceTextProperty, value);
    }

    public string TimeText
    {
        get => (string)GetValue(TimeTextProperty);
        set => SetValue(TimeTextProperty, value);
    }

    public string BadgeText
    {
        get => (string)GetValue(BadgeTextProperty);
        set => SetValue(BadgeTextProperty, value);
    }

    public bool IsFavorite
    {
        get => (bool)GetValue(IsFavoriteProperty);
        set => SetValue(IsFavoriteProperty, value);
    }

    public string MetaText => $"{PriceText} · {TimeText}";
    public string FavoriteIcon => IsFavorite ? "♥" : "♡";

    private static void OnFavoriteChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is FoodCardView view)
        {
            view.OnPropertyChanged(nameof(FavoriteIcon));
        }
    }
}