namespace ShopOrbit.Ordering.API.Models;

public class Address
{
    public string FirstName { get; set; } = default!;
    public string LastName { get; set; } = default!;
    public string? EmailAddress { get; set; }
    public string AddressLine { get; set; } = default!;
    public string Country { get; set; } = default!;
    public string State { get; set; } = default!;
    public string ZipCode { get; set; } = default!;
}