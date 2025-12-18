namespace ShopOrbit.BuildingBlocks.Contracts;

public record OrderTimeoutEvent
{
    public Guid OrderId { get; init; }
    public Guid? TimeoutTokenId { get; init; }
}