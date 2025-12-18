namespace ShopOrbit.BuildingBlocks.Contracts;

public record OrderCancelledEvent
{
    public Guid OrderId { get; init; }
    public List<OrderItemEvent> OrderItems { get; init; } = new();
}