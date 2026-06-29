using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/phong_thi")]
public class PhongThiController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index() => Ok(await dbContext.PhongThi.OrderBy(record => record.PhongThiID).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        PhongThi? record = await dbContext.PhongThi.FindAsync(id);
        return record is null ? NotFound(Error($"Exam room with ID {id} was not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        PhongThi? record = ReadBody<PhongThi>(body, "phong_thi");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid exam room payload."));
        }

        dbContext.PhongThi.Add(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.PhongThiID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate room code or invalid room data."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        PhongThi? record = await dbContext.PhongThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam room with ID {id} was not found."));
        }

        PhongThi? payload = ReadBody<PhongThi>(body, "phong_thi");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid exam room payload."));
        }

        record.MaPhong = payload.MaPhong;
        record.TenPhong = payload.TenPhong;
        record.ToaNha = payload.ToaNha;
        record.Tang = payload.Tang;
        record.SucChua = payload.SucChua;
        record.SoHang = payload.SoHang;
        record.SoCot = payload.SoCot;
        record.TrangThai = payload.TrangThai;
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        PhongThi? record = await dbContext.PhongThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Exam room with ID {id} was not found."));
        }

        dbContext.PhongThi.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Deleted exam room with ID {record.PhongThiID}." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error($"Cannot delete exam room with ID {record.PhongThiID} because it is used by an exam."));
        }
    }
}
