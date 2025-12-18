using Grpc.Core;
using ShopOrbit.Grpc;
using ShopOrbit.Catalog.API.Data;
using Microsoft.EntityFrameworkCore;

namespace ShopOrbit.Catalog.API.Services;

public class ProductGrpcService : ProductGrpc.ProductGrpcBase
{
    private readonly CatalogDbContext _context;
    private readonly ILogger<ProductGrpcService> _logger;

    public ProductGrpcService(CatalogDbContext context, ILogger<ProductGrpcService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override async Task<ProductModel> GetProduct(GetProductRequest request, ServerCallContext context)
    {
        _logger.LogInformation($"[gRPC] Received request for Product ID: {request.ProductId}");

        if (!Guid.TryParse(request.ProductId, out var guid))
        {
             throw new RpcException(new Status(StatusCode.InvalidArgument, "Invalid GUID format"));
        }

        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == guid);

        if (product == null)
        {
            return new ProductModel { Exists = false };
        }

        return new ProductModel
        {
            Id = product.Id.ToString(),
            Name = product.Name,
            Price = (double)product.Price,
            StockQuantity = product.StockQuantity,
            Exists = true
        };
    }
}