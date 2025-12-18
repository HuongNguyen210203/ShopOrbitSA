using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ShopOrbit.Payments.API.Models;

public class Payment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(3)] // VND, USD, EUR
    public string Currency { get; set; } = "VND";

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "COD"; // COD, Visa, Momo...

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Processing"; // Processing, Success, Failed, Refunded

    [Required]
    [MaxLength(20)]
    public string TransactionType { get; set; } = "Sale"; // Sale, Authorization, Capture, Refund
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? PaymentDate { get; set; }


    [MaxLength(100)]
    public string? ExternalTransactionId { get; set; } // ID from payment gateway
    public string? FailureReason { get; set; }
}