using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Domain.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

    public List<Order> CreatedOrders { get; set; } = [];
    public List<OrderResponse> Responses { get; set; } = [];
    public List<FavoriteOrder> FavoriteOrders { get; set; } = [];
}
