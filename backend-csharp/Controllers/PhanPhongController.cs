using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/phan_phong")]
public class PhanPhongController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<PhanPhong> records = await QueryWithIncludes().OrderBy(record => record.PhanPhongID).ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        PhanPhong? record = await QueryWithIncludes().FirstOrDefaultAsync(item => item.PhanPhongID == id);
        return record is null ? NotFound(Error("Room assignment not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        PhanPhong? record = ReadBody<PhanPhong>(body, "phan_phong");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid room assignment payload."));
        }

        DangKyThi? dangKyThi = await dbContext.DangKyThi.FindAsync(record.DangKyThiID);
        if (dangKyThi is null || await dbContext.PhongThi.FindAsync(record.PhongThiID) is null)
        {
            return NotFound(Error("Registration or room not found."));
        }

        record.KyThiID = dangKyThi.KyThiID;
        dbContext.PhanPhong.Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.PhanPhongID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("This registration has already been assigned to a room."));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        PhanPhong? record = await dbContext.PhanPhong.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error("Room assignment not found."));
        }

        dbContext.PhanPhong.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error("Cannot delete because this room assignment is already used in seating or attendance."));
        }
    }

    private IQueryable<PhanPhong> QueryWithIncludes()
    {
        return dbContext.PhanPhong
            .Include(record => record.KyThi)
            .Include(record => record.PhongThi)
            .Include(record => record.DangKyThi)
                .ThenInclude(record => record!.SinhVien);
    }
}
