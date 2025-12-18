namespace ShopOrbit.BuildingBlocks.Contracts;

public record OrderCreatedEvent
{
    public Guid OrderId { get; init; }
    public Guid UserId { get; init; }
    public decimal TotalAmount { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public string PaymentMethod { get; init; } = "COD";

    public List<OrderItemEvent> OrderItems { get; init; } = new();
}
