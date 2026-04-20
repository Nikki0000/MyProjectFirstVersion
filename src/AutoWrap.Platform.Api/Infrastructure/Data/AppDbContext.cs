using AutoWrap.Platform.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AutoWrap.Platform.Api.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderResponse> OrderResponses => Set<OrderResponse>();
    public DbSet<FavoriteOrder> FavoriteOrders => Set<FavoriteOrder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(160);
            entity.Property(x => x.FullName).HasMaxLength(160);
            entity.Property(x => x.PasswordHash).HasMaxLength(512);
            entity.Property(x => x.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(180);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.Budget).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasConversion<string>();

            entity.HasOne(x => x.CreatedByUser)
                .WithMany(x => x.CreatedOrders)
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderResponse>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Message).HasMaxLength(1000);
            entity.Property(x => x.ProposedPrice).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.OrderId, x.UserId }).IsUnique();

            entity.HasOne(x => x.Order)
                .WithMany(x => x.Responses)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Responses)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FavoriteOrder>(entity =>
        {
            entity.HasKey(x => new { x.UserId, x.OrderId });

            entity.HasOne(x => x.User)
                .WithMany(x => x.FavoriteOrders)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Order)
                .WithMany(x => x.FavoritedByUsers)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
