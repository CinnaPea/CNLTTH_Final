using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/xep_cho")]
public class XepChoController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<XepCho> records = await QueryWithIncludes().OrderBy(record => record.XepChoID).ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        XepCho? record = await QueryWithIncludes().FirstOrDefaultAsync(item => item.XepChoID == id);
        return record is null ? NotFound(Error("Seat assignment not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        XepCho? record = ReadBody<XepCho>(body, "xep_cho");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid seat assignment payload."));
        }

        PhanPhong? phanPhong = await dbContext.PhanPhong.FirstOrDefaultAsync(item => item.DangKyThiID == record.DangKyThiID);
        if (phanPhong is null)
        {
            return NotFound(Error("Room assignment not found for this registration."));
        }

        record.KyThiID = phanPhong.KyThiID;
        record.PhongThiID = phanPhong.PhongThiID;
        dbContext.XepCho.Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.XepChoID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate seat or this registration already has a seat."));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        XepCho? record = await dbContext.XepCho.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error("Seat assignment not found."));
        }

        dbContext.XepCho.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error("Cannot delete this seat assignment because it is being used."));
        }
    }

    private IQueryable<XepCho> QueryWithIncludes()
    {
        return dbContext.XepCho
            .Include(record => record.KyThi)
            .Include(record => record.PhongThi)
            .Include(record => record.DangKyThi)
                .ThenInclude(record => record!.SinhVien);
    }
}
