using AutoWrap.Platform.Api.Domain.Entities;
using AutoWrap.Platform.Api.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AutoWrap.Platform.Api.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext dbContext)
    {
        if (await dbContext.Users.AnyAsync())
        {
            return;
        }

        var hasher = new PasswordHasher<AppUser>();

        var customer = new AppUser
        {
            Email = "customer@demo.local",
            FullName = "Demo Customer",
            Role = UserRole.Customer
        };
        customer.PasswordHash = hasher.HashPassword(customer, "Demo123!");

        var wrapper = new AppUser
        {
            Email = "wrapper@demo.local",
            FullName = "Demo Wrapper",
            Role = UserRole.Wrapper
        };
        wrapper.PasswordHash = hasher.HashPassword(wrapper, "Demo123!");

        dbContext.Users.AddRange(customer, wrapper);

        dbContext.Orders.AddRange(
            new Order
            {
                Title = "Need vinyl wrap for city hatchback",
                Description = "Looking for white car full-side branding. Brand assets are ready.",
                City = "Moscow",
                Budget = 18000,
                PlannedDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                Status = OrderStatus.Open,
                CreatedByUser = customer
            },
            new Order
            {
                Title = "Courier vehicle ad placement",
                Description = "Need long-term wrap placement for courier line in downtown area.",
                City = "Saint Petersburg",
                Budget = 25000,
                PlannedDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14)),
                Status = OrderStatus.Open,
                CreatedByUser = customer
            });

        await dbContext.SaveChangesAsync();
    }
}
