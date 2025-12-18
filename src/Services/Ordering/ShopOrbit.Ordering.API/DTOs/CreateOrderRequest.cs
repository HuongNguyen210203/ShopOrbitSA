namespace ShopOrbit.Ordering.API.DTOs;

public record CreateOrderRequest(
    string ShippingAddress,
    string PaymentMethod, // "COD", "Visa", "Momo"
    string? Notes
);