using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class PaymentSucceededConsumer : IConsumer<PaymentSucceededEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<PaymentSucceededConsumer> _logger;
    private readonly IMessageScheduler _scheduler;
    private static readonly Uri OrderTimeoutQueue = new("queue:order-timeout");

    public PaymentSucceededConsumer(OrderingDbContext dbContext, ILogger<PaymentSucceededConsumer> logger, IMessageScheduler scheduler)
    {
        _dbContext = dbContext;
        _logger = logger;
        _scheduler = scheduler;
    }

    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Ordering Service] Received Payment Success for Order: {message.OrderId}");
        
        var order = await _dbContext.Orders.FindAsync(message.OrderId);
        
        if (order == null)
        {
            _logger.LogWarning($"Order {message.OrderId} not found!");
            return;
        }

        if (order.Status != "Pending")
        {
            _logger.LogError($"Order {message.OrderId} is in status {order.Status} but Payment Succeeded. Manual check required!");
            return; 
        }

        if (order.TimeoutTokenId.HasValue)
        {
            try 
            {
                await _scheduler.CancelScheduledSend(OrderTimeoutQueue, order.TimeoutTokenId.Value);
            }
            catch(Exception ex)
            {
                _logger.LogWarning($"Failed to cancel scheduler: {ex.Message}");
            }
            order.TimeoutTokenId = null;
        }

        order.Status = "Paid";
        order.PaymentId = message.PaymentId;

        _logger.LogInformation($"Order {message.OrderId} status updated to Paid.");

        await _dbContext.SaveChangesAsync();
    }
}