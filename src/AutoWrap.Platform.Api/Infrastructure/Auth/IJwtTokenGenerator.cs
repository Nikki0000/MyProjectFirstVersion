using AutoWrap.Platform.Api.Domain.Entities;

namespace AutoWrap.Platform.Api.Infrastructure.Auth;

public interface IJwtTokenGenerator
{
    string CreateToken(AppUser user);
}
