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
    [Theory]
    [InlineData("http://localhost:5173")]
    [InlineData("http://127.0.0.1:5173")]
    public async Task LocalFrontendOriginsAreAllowed(string origin)
    {
        await using var app = new ApiFactory();
        using var client = app.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/api/users");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "content-type");
        using var response = await client.SendAsync(request);
        response.EnsureSuccessStatusCode();
        Assert.Equal(origin, Assert.Single(response.Headers.GetValues("Access-Control-Allow-Origin")));
    }
}
