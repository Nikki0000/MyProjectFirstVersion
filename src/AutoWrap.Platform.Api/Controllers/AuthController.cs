using AutoWrap.Platform.Api.Contracts.Auth;
using AutoWrap.Platform.Api.Domain.Entities;
using AutoWrap.Platform.Api.Infrastructure.Auth;
using AutoWrap.Platform.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWrap.Platform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    AppDbContext dbContext,
    PasswordHasher<AppUser> passwordHasher,
    IJwtTokenGenerator tokenGenerator) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest("Заполните email, имя и пароль.");
        }

        var exists = await dbContext.Users.AnyAsync(x => x.Email == email);
        if (exists)
        {
            return Conflict("Пользователь с таким email уже существует.");
        }

        var user = new AppUser
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Role = request.Role
        };

        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return Ok(CreateAuthResponse(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email);
        if (user is null)
        {
            return Unauthorized("Неверный email или пароль.");
        }

        var verification = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
        {
            return Unauthorized("Неверный email или пароль.");
        }

        return Ok(CreateAuthResponse(user));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Me()
    {
        var userId = User.GetUserId();
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);

        if (user is null)
        {
            return NotFound("Пользователь не найден.");
        }

        return Ok(CreateAuthResponse(user));
    }

    private AuthResponse CreateAuthResponse(AppUser user)
    {
        return new AuthResponse
        {
            Token = tokenGenerator.CreateToken(user),
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role
        };
    }
}
