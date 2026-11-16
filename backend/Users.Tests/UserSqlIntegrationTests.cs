using System.Data.Common;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Users.Application.DTOs;
using Users.Infrastructure.Data;

namespace Users.Tests;

public sealed class SqlIntegrationFactAttribute : FactAttribute
{
    public SqlIntegrationFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("USERS_SQL_INTEGRATION") != "1")
            Skip = "Opt-in: configura ConnectionStrings__DefaultConnection y USERS_SQL_INTEGRATION=1 sobre una base local migrada.";
    }
}

public sealed class UserSqlIntegrationTests
{
    [SqlIntegrationFact]
    public async Task SqlServerPersistsLifecycleEnforcesUniqueIndexAndRollsBackTestData()
    {
        var configuredConnection = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
        Assert.False(string.IsNullOrWhiteSpace(configuredConnection));
        var metadata = new SqlConnectionStringBuilder(configuredConnection);
        var server = metadata.DataSource.Split('\\', ',')[0];
        var localAliases = new[] { ".", "(local)", "localhost", "127.0.0.1", "::1", "(localdb)", Environment.MachineName };
        Assert.Contains(server, localAliases, StringComparer.OrdinalIgnoreCase);
        Assert.DoesNotContain(metadata.InitialCatalog.ToLowerInvariant(), new[] { "master", "model", "msdb", "tempdb" });

        await using var connection = new SqlConnection(configuredConnection);
        await connection.OpenAsync();
        await using var transaction = await connection.BeginTransactionAsync();
        var marker = Guid.NewGuid().ToString("N");
        var email = $"sql-smoke-{marker}@example.test";
        await using var app = new TransactionalSqlFactory(connection, transaction);
        using var client = app.CreateClient();
        try
        {
            var input = new UserInput(" Prueba ", " SQL ", email, "Verificación", true);
            using var created = await client.PostAsJsonAsync("/api/users", input);
            Assert.Equal(HttpStatusCode.Created, created.StatusCode);
            var user = (await created.Content.ReadFromJsonAsync<UserDto>())!;
            Assert.Equal("Prueba", user.FirstName);
            Assert.Equal(user.Id, (await client.GetFromJsonAsync<UserDto>($"/api/users/{user.Id}"))!.Id);

            using var duplicate = await client.PostAsJsonAsync("/api/users", input with { Email = $" {email.ToUpperInvariant()} " });
            Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
            using var invalid = await client.PostAsJsonAsync("/api/users", input with { FirstName = " " });
            Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

            using var updated = await client.PutAsJsonAsync($"/api/users/{user.Id}", input with { FirstName = "Prueba editada" });
            updated.EnsureSuccessStatusCode();
            var edited = (await updated.Content.ReadFromJsonAsync<UserDto>())!;
            Assert.Equal("Prueba editada", edited.FirstName);
            Assert.Equal(user.CreatedAt, edited.CreatedAt);
            foreach (var active in new[] { false, true })
            {
                using var status = await client.PatchAsJsonAsync($"/api/users/{user.Id}/status", new StatusInput(active));
                status.EnsureSuccessStatusCode();
                Assert.Equal(active, (await status.Content.ReadFromJsonAsync<UserDto>())!.IsActive);
            }
            var found = await client.GetFromJsonAsync<UserDto[]>($"/api/users?search={marker}");
            Assert.Equal(user.Id, Assert.Single(found!).Id);

            // Omite la validación del servicio para probar el índice SQL real.
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new Domain.Entities.User
            {
                Id = Guid.NewGuid(), FirstName = "Duplicado", LastName = "SQL", Email = email,
                NormalizedEmail = email.ToUpperInvariant(), Role = "Verificación", IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
            });
            var exception = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
            var sqlError = Assert.IsType<SqlException>(exception.InnerException);
            Assert.Contains(sqlError.Number, new[] { 2601, 2627 });
        }
        finally
        {
            await transaction.RollbackAsync();
        }
        await using var verify = connection.CreateCommand();
        verify.CommandText = "SELECT COUNT(*) FROM dbo.ManagedUsers WHERE Email = @email";
        verify.Parameters.AddWithValue("@email", email);
        Assert.Equal(0, Convert.ToInt32(await verify.ExecuteScalarAsync()));
    }

    private sealed class TransactionalSqlFactory(SqlConnection connection, DbTransaction transaction) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<AppDbContext>>();
                services.RemoveAll<Microsoft.EntityFrameworkCore.Infrastructure.IDbContextOptionsConfiguration<AppDbContext>>();
                services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connection));
                services.RemoveAll<AppDbContext>();
                services.AddScoped(provider =>
                {
                    var db = new AppDbContext(provider.GetRequiredService<DbContextOptions<AppDbContext>>());
                    db.Database.UseTransaction(transaction);
                    return db;
                });
            });
        }
    }
}
