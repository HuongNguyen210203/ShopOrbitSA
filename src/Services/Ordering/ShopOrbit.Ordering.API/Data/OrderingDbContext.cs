using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.Ordering.API.Models;

namespace ShopOrbit.Ordering.API.Data;

public class OrderingDbContext : DbContext
{
    public OrderingDbContext(DbContextOptions<OrderingDbContext> options) : base(options)
    {
    }

    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Order>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId);
        
        modelBuilder.Entity<OrderItem>()
            .Property(oi => oi.Specifications)
            .HasColumnType("jsonb");
        
        modelBuilder.Entity<Order>().OwnsOne(o => o.ShippingAddress, a =>
        {
            a.Property(p => p.FirstName).HasMaxLength(50).HasColumnName("Shipping_FirstName");
            a.Property(p => p.LastName).HasMaxLength(50).HasColumnName("Shipping_LastName");
            a.Property(p => p.EmailAddress).HasMaxLength(50);
            a.Property(p => p.AddressLine).HasMaxLength(180).IsRequired();
            a.Property(p => p.Country).HasMaxLength(50);
            a.Property(p => p.State).HasMaxLength(50);
            a.Property(p => p.ZipCode).HasMaxLength(20);
        });

        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
    }
}