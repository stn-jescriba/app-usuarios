using System.ComponentModel.DataAnnotations;
using Users.Application.DTOs;
using Users.Domain.Entities;
using Users.Domain.Interfaces;
namespace Users.Application.Services;

public sealed class UserService(IUserRepository repository, TimeProvider clock)
{
    public async Task<IReadOnlyList<UserDto>> SearchAsync(string? search, CancellationToken ct) =>
        (await repository.SearchAsync(search?.Trim(), ct)).Select(UserDto.From).ToArray();

    public async Task<ServiceResult> GetAsync(Guid id, CancellationToken ct)
    {
        var user = await repository.FindAsync(id, ct);
        return user is null ? new(Error: ErrorKind.NotFound) : new(UserDto.From(user));
    }

    public async Task<ServiceResult> SaveAsync(Guid? id, UserInput input, CancellationToken ct)
    {
        var errors = Validate(input);
        if (errors.Count > 0) return new(Error: ErrorKind.Validation, Errors: errors);
        User? user = null;
        if (id.HasValue)
        {
            user = await repository.FindAsync(id.Value, ct);
            if (user is null) return new(Error: ErrorKind.NotFound);
        }
        var email = input.Email!.Trim();
        var normalizedEmail = email.ToUpperInvariant();
        if (await repository.EmailExistsAsync(normalizedEmail, id, ct)) return DuplicateEmail();
        var now = clock.GetUtcNow();
        user ??= new User { Id = Guid.NewGuid(), CreatedAt = now };
        user.FirstName = input.FirstName!.Trim();
        user.LastName = input.LastName!.Trim();
        user.Email = email;
        user.NormalizedEmail = normalizedEmail;
        user.Role = input.Role!.Trim();
        user.IsActive = input.IsActive!.Value;
        user.UpdatedAt = now;
        try
        {
            if (!id.HasValue) await repository.AddAsync(user, ct);
            await repository.SaveAsync(ct);
        }
        catch (DuplicateEmailException) { return DuplicateEmail(); }
        return new(UserDto.From(user));
    }

    public async Task<ServiceResult> SetStatusAsync(Guid id, StatusInput input, CancellationToken ct)
    {
        if (!input.IsActive.HasValue)
            return new(Error: ErrorKind.Validation, Errors: new() { ["isActive"] = ["Indica el estado del usuario."] });
        var user = await repository.FindAsync(id, ct);
        if (user is null) return new(Error: ErrorKind.NotFound);
        user.IsActive = input.IsActive.Value;
        user.UpdatedAt = clock.GetUtcNow();
        await repository.SaveAsync(ct);
        return new(UserDto.From(user));
    }

    private static ServiceResult DuplicateEmail() => new(Error: ErrorKind.Conflict,
        Errors: new() { ["email"] = ["Ya existe un usuario con este correo."] });

    private static Dictionary<string, string[]> Validate(UserInput input)
    {
        var errors = new Dictionary<string, string[]>();
        void Text(string key, string? value, string label, int max)
        {
            if (string.IsNullOrWhiteSpace(value)) errors[key] = [$"{label} es obligatorio."];
            else if (value.Trim().Length > max) errors[key] = [$"{label} debe tener como máximo {max} caracteres."];
        }
        Text("firstName", input.FirstName, "El nombre", 100);
        Text("lastName", input.LastName, "El apellido", 150);
        Text("email", input.Email, "El correo", 254);
        Text("role", input.Role, "El rol", 80);
        if (!errors.ContainsKey("email") && !new EmailAddressAttribute().IsValid(input.Email!.Trim()))
            errors["email"] = ["Ingresa un correo válido."];
        if (!input.IsActive.HasValue) errors["isActive"] = ["Indica el estado del usuario."];
        return errors;
    }
}
