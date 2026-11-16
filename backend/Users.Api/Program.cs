using Users.Api;
using Users.Application.Services;
using Microsoft.EntityFrameworkCore;
using Users.Infrastructure;
using Users.Infrastructure.Data;
var builder = WebApplication.CreateBuilder(args);
var connection = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connection))
    throw new InvalidOperationException("Configure ConnectionStrings__DefaultConnection antes de iniciar la API.");
builder.Services.AddInfrastructure(connection);
builder.Services.AddProblemDetails();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<UserService>();
var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseExceptionHandler();
app.UseCors();
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
}
app.MapUserEndpoints();
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Run();
public partial class Program;
