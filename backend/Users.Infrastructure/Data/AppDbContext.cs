using Microsoft.EntityFrameworkCore;
using Users.Domain.Entities;
namespace Users.Infrastructure.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        var user = model.Entity<User>();
        user.ToTable("ManagedUsers");
        user.HasKey(x => x.Id);
        user.Property(x => x.FirstName).HasMaxLength(100).IsRequired();
        user.Property(x => x.LastName).HasMaxLength(150).IsRequired();
        user.Property(x => x.Email).HasMaxLength(254).IsRequired();
        user.Property(x => x.NormalizedEmail).HasMaxLength(254).IsRequired();
        user.HasIndex(x => x.NormalizedEmail).IsUnique();
        user.Property(x => x.Role).HasMaxLength(80).IsRequired();
    }
}
