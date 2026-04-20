namespace AutoWrap.Platform.Api.Domain.Entities;

public sealed class OrderResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }

    public Guid UserId { get; set; }
    public AppUser? User { get; set; }

    public string Message { get; set; } = string.Empty;
    public decimal? ProposedPrice { get; set; }
    public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;
}
