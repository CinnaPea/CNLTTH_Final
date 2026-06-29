using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    protected static T? ReadBody<T>(JsonElement body, string rootName)
    {
        JsonElement payload = body;

        if (body.ValueKind == JsonValueKind.Object && body.TryGetProperty(rootName, out JsonElement wrapped))
        {
            payload = wrapped;
        }

        return payload.Deserialize<T>(JsonOptions);
    }

    protected static bool IsDatabaseConflict(DbUpdateException exception)
    {
        return exception.InnerException?.Message.Contains("conflict", StringComparison.OrdinalIgnoreCase) == true
            || exception.InnerException?.Message.Contains("duplicate", StringComparison.OrdinalIgnoreCase) == true
            || exception.InnerException?.Message.Contains("unique", StringComparison.OrdinalIgnoreCase) == true
            || exception.InnerException?.Message.Contains("foreign key", StringComparison.OrdinalIgnoreCase) == true;
    }

    protected static object Error(string message) => new { error = message };

    protected static object Errors(string message) => new { errors = new[] { message } };
}
