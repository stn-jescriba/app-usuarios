using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Users.Application.DTOs;
using Users.Infrastructure.Data;
namespace Users.Tests;

public sealed class UserApiTests
{
    private static UserInput Input(string email = "ana@example.test") => new(" Ana ", " Pérez ", email, " Operaciones ", true);
    private static async Task<UserDto> Create(HttpClient client, UserInput? input = null)
    {
        var response = await client.PostAsJsonAsync("/api/users", input ?? Input());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var user = (await response.Content.ReadFromJsonAsync<UserDto>())!;
        Assert.EndsWith(user.Id.ToString(), response.Headers.Location!.ToString());
        return user;
    }
    [Fact]
    public async Task CreateReadUpdateAndStatusPreserveData()
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient();
        var user = await Create(client);
        Assert.Equal("Ana", user.FirstName); Assert.Equal("Pérez", user.LastName); Assert.Equal("Operaciones", user.Role);
        Assert.True(user.IsActive);
        Assert.Equal(user.Id, (await client.GetFromJsonAsync<UserDto>($"/api/users/{user.Id}"))!.Id);
        var update = await client.PutAsJsonAsync($"/api/users/{user.Id}", Input() with { FirstName = "Andrea", Role = "Ventas" });
        update.EnsureSuccessStatusCode();
        var changed = (await update.Content.ReadFromJsonAsync<UserDto>())!;
        Assert.Equal("Andrea", changed.FirstName); Assert.Equal("Ventas", changed.Role); Assert.Equal(user.CreatedAt, changed.CreatedAt);
        foreach (var active in new[] { false, true })
        {
            var status = await client.PatchAsJsonAsync($"/api/users/{user.Id}/status", new StatusInput(active));
            status.EnsureSuccessStatusCode();
            var result = (await status.Content.ReadFromJsonAsync<UserDto>())!;
            Assert.Equal(active, result.IsActive); Assert.Equal("Andrea", result.FirstName);
        }
    }
    [Fact]
    public async Task EmailUniquenessIgnoresCaseAndSpacesAndAllowsOwnEmail()
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient();
        var user = await Create(client);
        var duplicate = await client.PostAsJsonAsync("/api/users", Input(" ANA@EXAMPLE.TEST "));
        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
        Assert.Contains("email", await duplicate.Content.ReadAsStringAsync());
        var own = await client.PutAsJsonAsync($"/api/users/{user.Id}", Input(" ANA@EXAMPLE.TEST "));
        own.EnsureSuccessStatusCode();
        var second = await Create(client, Input("other@example.test"));
        var collision = await client.PutAsJsonAsync($"/api/users/{second.Id}", Input("ana@example.test"));
        Assert.Equal(HttpStatusCode.Conflict, collision.StatusCode);
        var unchanged = await client.GetFromJsonAsync<UserDto>($"/api/users/{second.Id}");
        Assert.Equal("other@example.test", unchanged!.Email);
    }
    [Theory]
    [InlineData("", "Pérez", "ana@example.test", "Ventas", "firstName")]
    [InlineData("Ana", " ", "ana@example.test", "Ventas", "lastName")]
    [InlineData("Ana", "Pérez", "correo-invalido", "Ventas", "email")]
    [InlineData("Ana", "Pérez", "ana@example.test", "", "role")]
    public async Task InvalidInputReturnsFieldErrors(string first, string last, string email, string role, string field)
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient();
        var response = await client.PostAsJsonAsync("/api/users", new UserInput(first, last, email, role, true));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains(field, await response.Content.ReadAsStringAsync());
        Assert.Empty((await client.GetFromJsonAsync<UserDto[]>("/api/users"))!);
    }
    [Fact]
    public async Task MissingStatusAndExcessiveLengthAreRejected()
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient();
        var longName = await client.PostAsJsonAsync("/api/users", Input() with { FirstName = new string('x', 101) });
        Assert.Equal(HttpStatusCode.BadRequest, longName.StatusCode);
        var missing = await client.PostAsJsonAsync("/api/users", Input() with { IsActive = null });
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        var user = await Create(client);
        var noStatus = await client.PatchAsJsonAsync($"/api/users/{user.Id}/status", new StatusInput(null));
        Assert.Equal(HttpStatusCode.BadRequest, noStatus.StatusCode);
    }
    [Fact]
    public async Task SearchFindsNameEmailAndRoleAndReturnsEmptyForNoMatch()
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient();
        await Create(client); await Create(client, new("Luis", "Torres", "luis@example.test", "Finanzas", false));
        foreach (var term in new[] { "ana pérez", "ANA@EXAMPLE", "operaciones" })
            Assert.Single((await client.GetFromJsonAsync<UserDto[]>($"/api/users?search={Uri.EscapeDataString(term)}"))!);
        Assert.Equal(2, (await client.GetFromJsonAsync<UserDto[]>("/api/users"))!.Length);
        Assert.Empty((await client.GetFromJsonAsync<UserDto[]>("/api/users?search=sin-coincidencias"))!);
    }
    [Fact]
    public async Task UnknownUserReturns404()
    {
        await using var app = new ApiFactory(); using var client = app.CreateClient(); var id = Guid.NewGuid();
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/users/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PutAsJsonAsync($"/api/users/{id}", Input())).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.PatchAsJsonAsync($"/api/users/{id}/status", new StatusInput(false))).StatusCode);
    }
    [Fact]
    public void DatabaseModelEnforcesUniqueEmail()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlServer("model-only").Options);
        var entity = db.Model.FindEntityType(typeof(Domain.Entities.User))!;
        Assert.Contains(entity.GetIndexes(), index => index.IsUnique && index.Properties.Single().Name == "NormalizedEmail");
        Assert.Equal("ManagedUsers", entity.GetTableName());
    }
}
