namespace Users.Tests;

public sealed class HealthTests
{
    [Fact]
    public async Task HealthReturnsOk()
    {
        await using var app = new ApiFactory();
        using var client = app.CreateClient();
        var response = await client.GetAsync("/health");
        response.EnsureSuccessStatusCode();
    }
}
