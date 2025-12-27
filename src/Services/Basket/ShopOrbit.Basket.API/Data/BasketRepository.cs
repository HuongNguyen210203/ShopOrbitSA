using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using ShopOrbit.Basket.API.Models;

namespace ShopOrbit.Basket.API.Data;

public interface IBasketRepository
{
    Task<ShoppingCart?> GetBasketAsync(string userName);
    Task<ShoppingCart?> UpdateBasketAsync(ShoppingCart basket);
    Task DeleteBasketAsync(string userName);
}

public class BasketRepository : IBasketRepository
{
    private readonly IDistributedCache _redisCache;

    public BasketRepository(IDistributedCache redisCache)
    {
        _redisCache = redisCache;
    }

    public async Task<ShoppingCart?> GetBasketAsync(string userName)
    {
        var basket = await _redisCache.GetStringAsync(userName);
        if (string.IsNullOrEmpty(basket))
            return null;

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        return JsonSerializer.Deserialize<ShoppingCart>(basket, options);
    }

    public async Task<ShoppingCart?> UpdateBasketAsync(ShoppingCart basket)
    {
        var json = JsonSerializer.Serialize(basket);

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30)
        };
        
        await _redisCache.SetStringAsync(basket.UserName, json, options);

        return basket;
    }

    public async Task DeleteBasketAsync(string userName)
    {
        await _redisCache.RemoveAsync(userName);
    }
}