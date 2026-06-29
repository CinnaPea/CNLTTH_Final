using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/mon_thi")]
public class MonThiController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<MonThi> records = await dbContext.MonThi.OrderBy(record => record.MonThiID).ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        MonThi? record = await dbContext.MonThi.FindAsync(id);
        return record is null ? NotFound(Error($"Subject with ID {id} was not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        MonThi? record = ReadBody<MonThi>(body, "mon_thi");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid subject payload."));
        }

        dbContext.MonThi.Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.MonThiID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate subject code or invalid subject data."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        MonThi? record = await dbContext.MonThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Subject with ID {id} was not found."));
        }

        MonThi? payload = ReadBody<MonThi>(body, "mon_thi");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid subject payload."));
        }

        record.MaMon = payload.MaMon;
        record.TenMon = payload.TenMon;
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        MonThi? record = await dbContext.MonThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Subject with ID {id} was not found."));
        }

        dbContext.MonThi.Remove(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Deleted subject with ID {record.MonThiID}." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error($"Cannot delete subject with ID {record.MonThiID} because it is used by other operations."));
        }
    }
}
