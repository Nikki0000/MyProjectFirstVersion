using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Contracts.Orders;

public sealed class OrderResponseView
{
    public Guid ResponseId { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public decimal? ProposedPrice { get; set; }
    public DateTime CreatedUtc { get; set; }
}

public sealed class OrderView
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public DateOnly? PlannedDate { get; set; }
    public OrderStatus Status { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedUtc { get; set; }
    public int ResponsesCount { get; set; }
    public bool IsFavoritedByCurrentUser { get; set; }
    public IReadOnlyCollection<OrderResponseView> Responses { get; set; } = [];
}
