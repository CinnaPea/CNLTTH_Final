using backend_csharp.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/vai_tro")]
public class VaiTroController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index() => Ok(await dbContext.VaiTro.OrderBy(record => record.VaiTroID).ToListAsync());
}
