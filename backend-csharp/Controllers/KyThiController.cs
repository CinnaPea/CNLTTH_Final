using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/ky_thi")]
public class KyThiController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<KyThi> records = await dbContext.KyThi.Include(record => record.MonThi).OrderByDescending(record => record.KyThiID).ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        KyThi? record = await dbContext.KyThi.Include(item => item.MonThi).FirstOrDefaultAsync(item => item.KyThiID == id);
        return record is null ? NotFound(Error($"Exam with ID {id} was not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        KyThi? record = ReadBody<KyThi>(body, "ky_thi");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid exam payload."));
        }

        record.TrangThai = string.IsNullOrWhiteSpace(record.TrangThai) ? "draft" : record.TrangThai;
        dbContext.KyThi.Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.KyThiID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate exam code or invalid exam data."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        KyThi? record = await dbContext.KyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam with ID {id} was not found."));
        }

        KyThi? payload = ReadBody<KyThi>(body, "ky_thi");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid exam payload."));
        }

        record.MaKyThi = payload.MaKyThi;
        record.TenKyThi = payload.TenKyThi;
        record.MonThiID = payload.MonThiID;
        record.NgayThi = payload.NgayThi;
        record.GioBatDau = payload.GioBatDau;
        record.GioKetThuc = payload.GioKetThuc;
        record.ThoiHanDangKyDen = payload.ThoiHanDangKyDen;
        record.TrangThai = payload.TrangThai;
        record.MoTa = payload.MoTa;
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        KyThi? record = await dbContext.KyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam with ID {id} was not found."));
        }

        dbContext.KyThi.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Deleted exam with ID {record.KyThiID}." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error($"Cannot delete exam with ID {record.KyThiID} because it is used by exam operations."));
        }
    }

    [HttpPatch("{id:int}/publish")]
    public async Task<IActionResult> Publish(int id)
    {
        KyThi? record = await dbContext.KyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam with ID {id} was not found."));
        }

        if (record.TrangThai != "draft")
        {
            return UnprocessableEntity(new { error = "Only draft exams can be published.", current_status = record.TrangThai });
        }

        record.TrangThai = "published";
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpPatch("{id:int}/close")]
    public async Task<IActionResult> Close(int id)
    {
        KyThi? record = await dbContext.KyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam with ID {id} was not found."));
        }

        if (record.TrangThai != "attendance_open")
        {
            return UnprocessableEntity(new { error = "Only attendance-open exams can be closed.", current_status = record.TrangThai });
        }

        record.TrangThai = "closed";
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }
}
