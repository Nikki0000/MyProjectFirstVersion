using AutoWrap.Platform.Api.Contracts.Me;
using AutoWrap.Platform.Api.Contracts.Orders;
using AutoWrap.Platform.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWrap.Platform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class MeController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<ProfileView>> Profile()
    {
        var userId = User.GetUserId();

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return NotFound("Пользователь не найден.");
        }

        var createdOrders = await dbContext.Orders.CountAsync(x => x.CreatedByUserId == userId);
        var responses = await dbContext.OrderResponses.CountAsync(x => x.UserId == userId);
        var favorites = await dbContext.FavoriteOrders.CountAsync(x => x.UserId == userId);

        return Ok(new ProfileView
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            CreatedOrders = createdOrders,
            Responses = responses,
            Favorites = favorites
        });
    }

    [HttpGet("created-orders")]
    public Task<ActionResult<IReadOnlyCollection<OrderView>>> CreatedOrders() =>
        GetOrdersInternal(q => q.Where(x => x.CreatedByUserId == User.GetUserId()));

    [HttpGet("responded-orders")]
    public async Task<ActionResult<IReadOnlyCollection<OrderView>>> RespondedOrders()
    {
        var userId = User.GetUserId();
        var ids = await dbContext.OrderResponses
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.OrderId)
            .Distinct()
            .ToListAsync();

        return await GetOrdersInternal(q => q.Where(x => ids.Contains(x.Id)));
    }

    [HttpGet("favorites")]
    public async Task<ActionResult<IReadOnlyCollection<OrderView>>> Favorites()
    {
        var userId = User.GetUserId();
        var ids = await dbContext.FavoriteOrders
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.OrderId)
            .ToListAsync();

        return await GetOrdersInternal(q => q.Where(x => ids.Contains(x.Id)));
    }

    private async Task<ActionResult<IReadOnlyCollection<OrderView>>> GetOrdersInternal(Func<IQueryable<Domain.Entities.Order>, IQueryable<Domain.Entities.Order>> filter)
    {
        var userId = User.GetUserId();
        var query = filter(dbContext.Orders
            .AsNoTracking()
            .Include(x => x.CreatedByUser)
            .Include(x => x.Responses)
            .Include(x => x.FavoritedByUsers));

        var orders = await query
            .OrderByDescending(x => x.CreatedUtc)
            .Select(x => new OrderView
            {
                Id = x.Id,
                Title = x.Title,
                Description = x.Description,
                City = x.City,
                Budget = x.Budget,
                PlannedDate = x.PlannedDate,
                Status = x.Status,
                CreatedByUserId = x.CreatedByUserId,
                CreatedByName = x.CreatedByUser!.FullName,
                CreatedUtc = x.CreatedUtc,
                ResponsesCount = x.Responses.Count,
                IsFavoritedByCurrentUser = x.FavoritedByUsers.Any(f => f.UserId == userId)
            })
            .ToListAsync();

        return Ok(orders);
    }
}
