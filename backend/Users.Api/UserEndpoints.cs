using Users.Application.DTOs;
using Users.Application.Services;
namespace Users.Api;

public static class UserEndpoints
{
    public static void MapUserEndpoints(this WebApplication app)
    {
        var users = app.MapGroup("/api/users");
        users.MapGet("/", async (string? search, UserService service, CancellationToken ct) =>
            Results.Ok(await service.SearchAsync(search, ct)));
        users.MapGet("/{id:guid}", async (Guid id, UserService service, CancellationToken ct) =>
            ToHttp(await service.GetAsync(id, ct)));
        users.MapPost("/", async (UserInput input, UserService service, CancellationToken ct) =>
        {
            var result = await service.SaveAsync(null, input, ct);
            return result.Error is null ? Results.Created($"/api/users/{result.Value!.Id}", result.Value) : ToHttp(result);
        });
        users.MapPut("/{id:guid}", async (Guid id, UserInput input, UserService service, CancellationToken ct) =>
            ToHttp(await service.SaveAsync(id, input, ct)));
        users.MapPatch("/{id:guid}/status", async (Guid id, StatusInput input, UserService service, CancellationToken ct) =>
            ToHttp(await service.SetStatusAsync(id, input, ct)));
    }
    private static IResult ToHttp(ServiceResult result) => result.Error switch
    {
        ErrorKind.NotFound => Results.Problem(statusCode: 404, title: "Usuario no encontrado."),
        ErrorKind.Conflict => Results.ValidationProblem(result.Errors!, statusCode: 409, title: "El correo ya está registrado."),
        ErrorKind.Validation => Results.ValidationProblem(result.Errors!, title: "Revisa los campos indicados."),
        _ => Results.Ok(result.Value)
    };
}
