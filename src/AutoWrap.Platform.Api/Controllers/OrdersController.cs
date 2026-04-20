using AutoWrap.Platform.Api.Contracts.Orders;
using AutoWrap.Platform.Api.Domain.Entities;
using AutoWrap.Platform.Api.Domain.Enums;
using AutoWrap.Platform.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AutoWrap.Platform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyCollection<OrderView>>> GetAll([FromQuery] string? query, [FromQuery] OrderStatus? status)
    {
        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : Guid.Empty;

        var ordersQuery = dbContext.Orders
            .AsNoTracking()
            .Include(x => x.CreatedByUser)
            .Include(x => x.Responses)
            .Include(x => x.FavoritedByUsers)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToLowerInvariant();
            ordersQuery = ordersQuery.Where(x => x.Title.ToLower().Contains(normalized) || x.Description.ToLower().Contains(normalized) || x.City.ToLower().Contains(normalized));
        }

        if (status.HasValue)
        {
            ordersQuery = ordersQuery.Where(x => x.Status == status.Value);
        }

        var orders = await ordersQuery
            .OrderByDescending(x => x.CreatedUtc)
            .ToListAsync();

        return Ok(orders.Select(order => ToOrderView(order, currentUserId, includeResponses: false)).ToList());
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<OrderView>> GetById(Guid id)
    {
        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : Guid.Empty;

        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.CreatedByUser)
            .Include(x => x.Responses)
                .ThenInclude(x => x.User)
            .Include(x => x.FavoritedByUsers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order is null)
        {
            return NotFound("Order not found.");
        }

        var includeResponses = User.Identity?.IsAuthenticated == true &&
                               (order.CreatedByUserId == currentUserId || User.HasRole(UserRole.Admin));

        return Ok(ToOrderView(order, currentUserId, includeResponses));
    }

    [HttpPost]
    public async Task<ActionResult<OrderView>> Create([FromBody] CreateOrderRequest request)
    {
        var userId = User.GetUserId();

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description) || string.IsNullOrWhiteSpace(request.City))
        {
            return BadRequest("Укажите название, описание и город.");
        }

        var order = new Order
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            City = request.City.Trim(),
            Budget = request.Budget,
            PlannedDate = request.PlannedDate,
            CreatedByUserId = user.Id,
            Status = OrderStatus.Open
        };

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();

        order.CreatedByUser = user;
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToOrderView(order, userId, includeResponses: true));
    }

    [HttpPost("{id:guid}/respond")]
    public async Task<ActionResult> Respond(Guid id, [FromBody] RespondToOrderRequest request)
    {
        var userId = User.GetUserId();

        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return Unauthorized();
        }

        if (user.Role is not UserRole.Wrapper and not UserRole.Admin)
        {
            return Forbid();
        }

        var order = await dbContext.Orders.FirstOrDefaultAsync(x => x.Id == id);
        if (order is null)
        {
            return NotFound("Заказ не найден.");
        }

        if (order.CreatedByUserId == userId)
        {
            return BadRequest("Нельзя откликаться на собственный заказ.");
        }

        if (order.Status != OrderStatus.Open)
        {
            return BadRequest("Отклик возможен только на открытый заказ.");
        }

        var alreadyExists = await dbContext.OrderResponses.AnyAsync(x => x.OrderId == id && x.UserId == userId);
        if (alreadyExists)
        {
            return Conflict("Вы уже откликнулись на этот заказ.");
        }

        var response = new OrderResponse
        {
            OrderId = id,
            UserId = userId,
            Message = request.Message.Trim(),
            ProposedPrice = request.ProposedPrice
        };

        dbContext.OrderResponses.Add(response);
        await dbContext.SaveChangesAsync();

        return Ok();
    }

    [HttpPost("{id:guid}/favorite")]
    public async Task<ActionResult> AddFavorite(Guid id)
    {
        var userId = User.GetUserId();

        var orderExists = await dbContext.Orders.AnyAsync(x => x.Id == id);
        if (!orderExists)
        {
            return NotFound("Заказ не найден.");
        }

        var exists = await dbContext.FavoriteOrders.AnyAsync(x => x.UserId == userId && x.OrderId == id);
        if (exists)
        {
            return Ok();
        }

        dbContext.FavoriteOrders.Add(new FavoriteOrder { UserId = userId, OrderId = id });
        await dbContext.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id:guid}/favorite")]
    public async Task<ActionResult> RemoveFavorite(Guid id)
    {
        var userId = User.GetUserId();

        var favorite = await dbContext.FavoriteOrders.FirstOrDefaultAsync(x => x.UserId == userId && x.OrderId == id);
        if (favorite is null)
        {
            return NoContent();
        }

        dbContext.FavoriteOrders.Remove(favorite);
        await dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<OrderView>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var userId = User.GetUserId();

        var order = await dbContext.Orders
            .Include(x => x.CreatedByUser)
            .Include(x => x.Responses)
                .ThenInclude(x => x.User)
            .Include(x => x.FavoritedByUsers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (order is null)
        {
            return NotFound("Заказ не найден.");
        }

        if (order.CreatedByUserId != userId && !User.HasRole(UserRole.Admin))
        {
            return Forbid();
        }

        order.Status = request.Status;
        await dbContext.SaveChangesAsync();

        return Ok(ToOrderView(order, userId, includeResponses: true));
    }

    private static OrderView ToOrderView(Order order, Guid currentUserId, bool includeResponses)
    {
        return new OrderView
        {
            Id = order.Id,
            Title = order.Title,
            Description = order.Description,
            City = order.City,
            Budget = order.Budget,
            PlannedDate = order.PlannedDate,
            Status = order.Status,
            CreatedByUserId = order.CreatedByUserId,
            CreatedByName = order.CreatedByUser?.FullName ?? "Unknown",
            CreatedUtc = order.CreatedUtc,
            ResponsesCount = order.Responses.Count,
            IsFavoritedByCurrentUser = currentUserId != Guid.Empty && order.FavoritedByUsers.Any(x => x.UserId == currentUserId),
            Responses = includeResponses
                ? order.Responses
                    .OrderByDescending(x => x.CreatedUtc)
                    .Select(x => new OrderResponseView
                    {
                        ResponseId = x.Id,
                        UserId = x.UserId,
                        UserName = x.User?.FullName ?? "Unknown",
                        Message = x.Message,
                        ProposedPrice = x.ProposedPrice,
                        CreatedUtc = x.CreatedUtc
                    })
                    .ToList()
                : []
        };
    }
}
