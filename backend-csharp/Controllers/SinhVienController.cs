using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/sinh_vien")]
public class SinhVienController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index() => Ok(await dbContext.SinhVien.OrderBy(record => record.SinhVienID).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        SinhVien? record = await dbContext.SinhVien.FindAsync(id);
        return record is null ? NotFound(Error($"Student with ID {id} was not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        SinhVien? record = ReadBody<SinhVien>(body, "sinh_vien");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid student payload."));
        }

        dbContext.SinhVien.Add(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.SinhVienID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate student code or invalid student data."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        SinhVien? record = await dbContext.SinhVien.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Student with ID {id} was not found."));
        }

        SinhVien? payload = ReadBody<SinhVien>(body, "sinh_vien");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid student payload."));
        }

        record.MaSinhVien = payload.MaSinhVien;
        record.HoTen = payload.HoTen;
        record.Lop = payload.Lop;
        record.Email = payload.Email;
        record.DienThoai = payload.DienThoai;
        record.TrangThai = payload.TrangThai;
        record.NguoiDungID = payload.NguoiDungID;
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        SinhVien? record = await dbContext.SinhVien.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"Student with ID {id} was not found."));
        }

        dbContext.SinhVien.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Deleted student with ID {record.SinhVienID}." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error($"Cannot delete student with ID {record.SinhVienID} because the student has exam registrations."));
        }
    }
}
