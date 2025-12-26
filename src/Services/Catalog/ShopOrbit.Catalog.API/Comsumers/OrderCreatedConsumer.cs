using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.Models;

namespace ShopOrbit.Catalog.API.Comsumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly CatalogDbContext _dbContext;
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(CatalogDbContext dbContext, ILogger<OrderCreatedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Catalog] Checking stock for Order: {message.OrderId}");

        var productIds = message.OrderItems.Select(x => x.ProductId).ToList();
        
        var products = await _dbContext.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var outOfStockItems = new List<Guid>();
        var reservedItems = new List<OrderItemEvent>();

        foreach (var item in message.OrderItems)
        {
            var rowsAffected = await _dbContext.Products
                .Where(p => p.Id == item.ProductId && p.StockQuantity >= item.Quantity)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.StockQuantity, p => p.StockQuantity - item.Quantity));

            if (rowsAffected > 0)
            {
                reservedItems.Add(item);
                _logger.LogInformation($"Reserved {item.Quantity} of Product {item.ProductId}");
            }
            else
            {
                outOfStockItems.Add(item.ProductId);
                _logger.LogWarning($"Product {item.ProductId} failed to reserve (OOS).");
            }
        }

        if (outOfStockItems.Count > 0)
        {
            _logger.LogWarning($"Order {message.OrderId} failed due to insufficient stock. Rolling back reserved items...");

            foreach (var item in reservedItems)
            {
                await _dbContext.Products
                    .Where(p => p.Id == item.ProductId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(p => p.StockQuantity, p => p.StockQuantity + item.Quantity));
            }

            await context.Publish(new StockReservationFailedEvent
            {
                OrderId = message.OrderId,
                Reason = "Insufficient stock for items: " + string.Join(", ", outOfStockItems),
                FailedItemIds = outOfStockItems
            });
        }
        else
        {
             _logger.LogInformation($"All items reserved successfully for Order {message.OrderId}");
        }
    }
}