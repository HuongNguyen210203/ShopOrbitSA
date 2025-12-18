using MassTransit;
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
        _logger.LogInformation($"[RabbitMQ] Received Order Created: {message.OrderId} - Amount: {message.TotalAmount}");

        foreach (var item in message.OrderItems)
        {
            var product = await _dbContext.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.StockQuantity -= item.Quantity;
                _logger.LogInformation($"[Updated stock for Product {product.Id}: New Stock = {product.StockQuantity}");

                if (product.StockQuantity < 0)
                {
                    _logger.LogWarning($"[Stock Warning] Product {product.Id} is out of stock!");
                }
            }
        }
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation($"Finished processing Order Created: {message.OrderId}");
    }
}