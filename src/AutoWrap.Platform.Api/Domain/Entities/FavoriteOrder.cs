namespace AutoWrap.Platform.Api.Domain.Entities;

public sealed class FavoriteOrder
{
    public Guid UserId { get; set; }
    public AppUser? User { get; set; }

    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
