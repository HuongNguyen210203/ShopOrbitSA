using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Quartz;
using ShopOrbit.Grpc;
using ShopOrbit.Ordering.API.Consumers;
using ShopOrbit.Ordering.API.Data;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

AppContext.SetSwitch("System.Net.Http.SocketsHttpHandler.Http2UnencryptedSupport", true);

builder.Services.AddDbContext<OrderingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// MassTransit (RabbitMQ)
builder.Services.AddMassTransit(x =>
{
    x.AddMessageScheduler(new Uri("queue:quartz"));
    x.AddQuartzConsumers();
    // x.AddPublishMessageScheduler();

    x.AddConsumer<OrderTimeoutConsumer>();
    x.AddConsumer<PaymentSucceededConsumer>();
    x.AddConsumer<PaymentFailedConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        var rabbitUser = builder.Configuration["RabbitMq:UserName"] ?? "guest";
        var rabbitPass = builder.Configuration["RabbitMq:Password"] ?? "guest";

        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        // cfg.UsePublishMessageScheduler(); 

        cfg.UseMessageScheduler(new Uri("queue:quartz"));

        cfg.ReceiveEndpoint("order-timeout", e =>
        {
            e.ConfigureConsumer<OrderTimeoutConsumer>(context);
        });

        cfg.ConfigureEndpoints(context);
        
        cfg.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
    });
});

builder.Services.AddQuartz(q =>
{
#pragma warning disable CS0618 // Type or member is obsolete
    q.UseMicrosoftDependencyInjectionJobFactory();
#pragma warning restore CS0618 // Type or member is obsolete
    q.UsePersistentStore(s =>
    {
#pragma warning disable CS8604 // Possible null reference argument.
        s.UsePostgres(builder.Configuration.GetConnectionString("DefaultConnection"));
#pragma warning restore CS8604 // Possible null reference argument.
#pragma warning disable CS0618 // Type or member is obsolete
        s.UseJsonSerializer();
#pragma warning restore CS0618 // Type or member is obsolete
        s.UseClustering();
    });
});

builder.Services.AddQuartzHostedService(q =>
{
    q.WaitForJobsToComplete = true;
});

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
});

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"] ?? "ShopOrbit_SecretKey_Must_Be_Very_Long_And_Secure_12345!");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(secretKey)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();

var catalogGrpcUrl = builder.Configuration["GrpcSettings:CatalogUrl"];

if (string.IsNullOrEmpty(catalogGrpcUrl))
{
    catalogGrpcUrl = "http://localhost:5062"; 
}

builder.Services.AddGrpcClient<ProductGrpc.ProductGrpcClient>(options =>
{
    options.Address = new Uri(catalogGrpcUrl);
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<OrderingDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();