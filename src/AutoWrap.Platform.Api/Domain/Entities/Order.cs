using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Domain.Entities;

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateOnly? PlannedDate { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Open;
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }
    public AppUser? CreatedByUser { get; set; }

    public List<OrderResponse> Responses { get; set; } = [];
    public List<FavoriteOrder> FavoritedByUsers { get; set; } = [];
}
