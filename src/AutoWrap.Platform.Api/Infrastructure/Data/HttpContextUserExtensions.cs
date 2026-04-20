using System.Security.Claims;
using AutoWrap.Platform.Api.Domain.Enums;

namespace AutoWrap.Platform.Api.Infrastructure.Data;

public static class HttpContextUserExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        if (Guid.TryParse(value, out var id))
        {
            return id;
        }

        throw new InvalidOperationException("Unable to resolve user id from token.");
    }

    public static bool HasRole(this ClaimsPrincipal user, UserRole role)
        => user.IsInRole(role.ToString());
}
