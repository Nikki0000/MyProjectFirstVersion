using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Contracts.Auth;

public sealed class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
}
