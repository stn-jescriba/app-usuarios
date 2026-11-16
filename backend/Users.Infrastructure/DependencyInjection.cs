using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Users.Domain.Interfaces;
using Users.Infrastructure.Data;
using Users.Infrastructure.Repositories;
namespace Users.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string connection)
    {
        services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection));
        services.AddScoped<IUserRepository, UserRepository>();
        return services;
    }
}
