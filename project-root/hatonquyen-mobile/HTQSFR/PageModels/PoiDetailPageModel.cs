using System.Collections.ObjectModel;
using HTQSFR.PageModels;

namespace HTQSFR.PageModels;

public class PoiDetailPageModel
{
    public string CoverImage { get; set; } = "dish_pizza.jpg";
    public string Name { get; set; } = "Pizza Palace";
    public string RatingText { get; set; } = "4.8";
    public string Category { get; set; } = "Italian Food";
    public string Address { get; set; } = "123 Hà Tôn Quyền, Quận 11";
    public string Description { get; set; } =
        "Pizza Palace là một địa điểm nổi bật tại khu phố ẩm thực Hà Tôn Quyền, nổi tiếng với pizza đế mỏng, topping phong phú và không gian trẻ trung phù hợp cho nhóm bạn và gia đình.";

    public string ReviewUser { get; set; } = "Nguyễn Minh";
    public string ReviewText { get; set; } =
        "Quán lên món nhanh, pizza ngon, phô mai nhiều và giá ổn.";

    public ObservableCollection<MenuPreviewItem> MenuItems { get; set; }

    public PoiDetailPageModel()
    {
        MenuItems = new ObservableCollection<MenuPreviewItem>
        {
            new() { Name = "Cheese Pizza", Price = "120.000đ", Image = "dish_pizza.jpg" },
            new() { Name = "Beef Burger", Price = "89.000đ", Image = "dish_burger.jpg" },
            new() { Name = "Milkshake", Price = "45.000đ", Image = "drink_milkshake.jpg" }
        };
    }
}