using Users.Domain.Entities;
namespace Users.Domain.Interfaces;

public interface IUserRepository
{
    Task<IReadOnlyList<User>> SearchAsync(string? search, CancellationToken cancellationToken);
    Task<User?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> EmailExistsAsync(string normalizedEmail, Guid? exceptId, CancellationToken cancellationToken);
    Task AddAsync(User user, CancellationToken cancellationToken);
    Task SaveAsync(CancellationToken cancellationToken);
}
public sealed class DuplicateEmailException : Exception;
