using Users.Domain.Entities;
namespace Users.Application.DTOs;

public sealed record UserInput(string? FirstName, string? LastName, string? Email, string? Role, bool? IsActive);
public sealed record StatusInput(bool? IsActive);
public sealed record UserDto(Guid Id, string FirstName, string LastName, string Email, string Role,
    bool IsActive, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)
{
    public static UserDto From(User user) => new(user.Id, user.FirstName, user.LastName, user.Email,
        user.Role, user.IsActive, user.CreatedAt, user.UpdatedAt);
}
public enum ErrorKind { Validation, NotFound, Conflict }
public sealed record ServiceResult(UserDto? Value = null, ErrorKind? Error = null, Dictionary<string, string[]>? Errors = null);
