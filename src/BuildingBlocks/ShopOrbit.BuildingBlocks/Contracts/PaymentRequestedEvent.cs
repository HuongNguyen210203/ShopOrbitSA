namespace ShopOrbit.BuildingBlocks.Contracts;

public record PaymentRequestedEvent
{
    public Guid OrderId { get; init; }
    public Guid UserId { get; init; }
    public decimal Amount { get; init; }
    public string Currency { get; init; } = "VND";
    public string PaymentMethod { get; init; } = "COD";
}
