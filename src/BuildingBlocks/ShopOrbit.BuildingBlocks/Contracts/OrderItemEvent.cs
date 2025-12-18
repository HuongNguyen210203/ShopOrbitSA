namespace ShopOrbit.BuildingBlocks.Contracts;

public record OrderItemEvent
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; }
}