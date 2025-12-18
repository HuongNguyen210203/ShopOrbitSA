using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Catalog.API.Data;

namespace ShopOrbit.Catalog.API.Comsumers;

public class OrderCancelledConsumer : IConsumer<OrderCancelledEvent>
{
    private readonly CatalogDbContext _dbContext;
    private readonly ILogger<OrderCancelledConsumer> _logger;
    private readonly IDistributedCache _cache;

    public OrderCancelledConsumer(CatalogDbContext dbContext, ILogger<OrderCancelledConsumer> logger, IDistributedCache cache)
    {
        _dbContext = dbContext;
        _logger = logger;
        _cache = cache;
    }

    public async Task Consume(ConsumeContext<OrderCancelledEvent> context)
    {
        var key = $"restocked_order_{context.Message.OrderId}";
        var processed = await _cache.GetStringAsync(key);
        if (!string.IsNullOrEmpty(processed)) 
        {
            _logger.LogInformation("Order already restocked. Skipping.");
            return;
        }

        foreach (var item in context.Message.OrderItems)
        {
            var product = await _dbContext.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.StockQuantity += item.Quantity;
            }
        }
        await _dbContext.SaveChangesAsync();

        await _cache.SetStringAsync(key, "processed", new DistributedCacheEntryOptions 
        { 
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1) 
        });
        
        _logger.LogInformation($"Restored stock for Order {context.Message.OrderId}");
    }
}