using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopOrbit.Ordering.API.Models;

public class Order
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Paid, Shipped...

    [Required] 
    public Address ShippingAddress { get; set; } = default!;

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = string.Empty; // COD, Visa, Momo...

    public string? Notes { get; set; } 
    public Guid? PaymentId { get; set; }
    public Guid? TimeoutTokenId { get; set; }
    
    public List<OrderItem> Items { get; set; } = new();
}