namespace AutoWrap.Platform.Api.Contracts.Me;

public sealed class ProfileView
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int CreatedOrders { get; set; }
    public int Responses { get; set; }
    public int Favorites { get; set; }
}
