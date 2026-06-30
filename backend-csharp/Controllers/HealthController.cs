using backend_csharp.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/health")]
public class HealthController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var connection = dbContext.Database.GetDbConnection();
        bool canConnect = await dbContext.Database.CanConnectAsync();

        if (!canConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                backend = "csharp",
                database = connection.Database,
                server = connection.DataSource,
                message = "API is running but cannot connect to SQL Server"
            });
        }

        return Ok(new
        {
            status = "ok",
            backend = "csharp",
            database = connection.Database,
            server = connection.DataSource,
            message = "API and SQL Server are healthy"
        });
    }
}
