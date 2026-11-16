namespace Users.Tests;

public sealed class ArchitectureTests
{
    [Fact]
    public void DomainDoesNotReferenceOtherLayersOrPersistence()
    {
        var references = typeof(Domain.AssemblyMarker).Assembly.GetReferencedAssemblies();
        Assert.DoesNotContain(references, r => r.Name!.StartsWith("Users.") || r.Name.StartsWith("Microsoft.EntityFrameworkCore"));
    }
    [Fact]
    public void ApplicationOnlyReferencesDomain()
    {
        var references = typeof(Application.AssemblyMarker).Assembly.GetReferencedAssemblies();
        Assert.DoesNotContain(references, r => (r.Name!.StartsWith("Users.") && r.Name != "Users.Domain") || r.Name.StartsWith("Microsoft.EntityFrameworkCore"));
    }
}
