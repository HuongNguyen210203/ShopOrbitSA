using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Payments.API.Data;

namespace ShopOrbit.Payments.API.Consumers;

public class OrderCancelledConsumer : IConsumer<OrderCancelledEvent>
{
    private readonly PaymentDbContext _dbContext;
    private readonly ILogger<OrderCancelledConsumer> _logger;

    public OrderCancelledConsumer(PaymentDbContext dbContext, ILogger<OrderCancelledConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCancelledEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Payment Service] Syncing cancellation for Order {message.OrderId}");

        var hangingPayment = await _dbContext.Payments
            .FirstOrDefaultAsync(p => p.OrderId == message.OrderId && p.Status == "Processing");

        if (hangingPayment != null)
        {
            hangingPayment.Status = "Failed";
            hangingPayment.FailureReason = "Order Cancelled due to Timeout (User did not complete payment)";
            
            await _dbContext.SaveChangesAsync();
            
            _logger.LogWarning($"Updated Payment {hangingPayment.Id} to Failed because Order {message.OrderId} timed out.");
        }
        else
        {
            _logger.LogInformation($"No pending payment found for Order {message.OrderId}. No action needed.");
        }
    }
}