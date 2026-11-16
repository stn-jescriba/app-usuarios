using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Users.Domain.Entities;
using Users.Domain.Interfaces;
using Users.Infrastructure.Data;
namespace Users.Infrastructure.Repositories;

public sealed class UserRepository(AppDbContext db) : IUserRepository
{
    public async Task<IReadOnlyList<User>> SearchAsync(string? search, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToUpperInvariant();
            query = query.Where(x => (x.FirstName + " " + x.LastName).ToUpper().Contains(term)
                || x.NormalizedEmail.Contains(term) || x.Role.ToUpper().Contains(term));
        }
        return await query.OrderBy(x => x.LastName).ThenBy(x => x.FirstName).ThenBy(x => x.Id).ToListAsync(ct);
    }
    public Task<User?> FindAsync(Guid id, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
    public Task<bool> EmailExistsAsync(string email, Guid? exceptId, CancellationToken ct) =>
        db.Users.AnyAsync(x => x.NormalizedEmail == email && (!exceptId.HasValue || x.Id != exceptId.Value), ct);
    public async Task AddAsync(User user, CancellationToken ct) => await db.Users.AddAsync(user, ct);
    public async Task SaveAsync(CancellationToken ct)
    {
        try { await db.SaveChangesAsync(ct); }
        catch (DbUpdateException error) when (error.InnerException is SqlException { Number: 2601 or 2627 })
        { throw new DuplicateEmailException(); }
    }
}
