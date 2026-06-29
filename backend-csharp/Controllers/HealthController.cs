using backend_csharp.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/health")]
public class HealthController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public IActionResult Index()
    {
        string databaseName = dbContext.Database.GetDbConnection().Database;
        return Ok(new { status = "ok", database = databaseName, message = "API is healthy" });
    }
}
