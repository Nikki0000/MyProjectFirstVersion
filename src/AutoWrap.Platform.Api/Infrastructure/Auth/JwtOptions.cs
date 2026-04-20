namespace AutoWrap.Platform.Api.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "AutoWrap.Platform";
    public string Audience { get; init; } = "AutoWrap.Platform.Client";
    public string Key { get; init; } = "ReplaceWithLongStrongSecretForBetaEnvironmentOnly123!";
    public int ExpirationMinutes { get; init; } = 120;
}
