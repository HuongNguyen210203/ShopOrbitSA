namespace ShopOrbit.Ordering.API.DTOs;

public record CreateOrderRequest(
    AddressDto ShippingAddress,
    string PaymentMethod, // "COD", "Visa", "Momo"
    string? Notes
);