using Elsa.Identity.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

// ReSharper disable once CheckNamespace
namespace Elsa.Extensions;

/// <summary>
/// Configures the <see cref="JwtBearerOptions"/>
/// </summary>
public class ConfigureJwtBearerOptions : IConfigureOptions<JwtBearerOptions>
{
    private readonly IOptions<IdentityTokenOptions> _identityTokenOptions;

    /// <summary>
    /// Initializes a new instance of <see cref="ConfigureJwtBearerOptions"/>.
    /// </summary>
    public ConfigureJwtBearerOptions(IOptions<IdentityTokenOptions> identityTokenOptions)
    {
        _identityTokenOptions = identityTokenOptions;
    }

    /// <inheritdoc />
    public void Configure(JwtBearerOptions options)
    {
        _identityTokenOptions.Value.ConfigureJwtBearerOptions(options);
    }
}