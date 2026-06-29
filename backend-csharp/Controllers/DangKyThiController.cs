using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/dang_ky_thi")]
public class DangKyThiController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<DangKyThi> records = await dbContext.DangKyThi
            .Include(record => record.KyThi)
            .Include(record => record.SinhVien)
            .OrderBy(record => record.DangKyThiID)
            .ToListAsync();

        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        DangKyThi? record = await dbContext.DangKyThi
            .Include(item => item.KyThi)
            .Include(item => item.SinhVien)
            .FirstOrDefaultAsync(item => item.DangKyThiID == id);

        return record is null ? NotFound(Error("Registration not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        DangKyThi? record = ReadBody<DangKyThi>(body, "dang_ky_thi");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid registration payload."));
        }

        KyThi? kyThi = await dbContext.KyThi.FindAsync(record.KyThiID);
        SinhVien? sinhVien = await dbContext.SinhVien.FindAsync(record.SinhVienID);
        if (kyThi is null || sinhVien is null)
        {
            return NotFound(Error("Exam or student not found."));
        }

        if (kyThi.TrangThai != "published")
        {
            return UnprocessableEntity(Error("Only published exams can accept registrations."));
        }

        record.TrangThaiDangKy = string.IsNullOrWhiteSpace(record.TrangThaiDangKy) ? "registered" : record.TrangThaiDangKy;
        record.SoBaoDanh = string.IsNullOrWhiteSpace(record.SoBaoDanh) ? await GenerateSoBaoDanh(record.KyThiID) : record.SoBaoDanh;

        dbContext.DangKyThi.Add(record);

        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.DangKyThiID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("This student is already registered for this exam or the exam number already exists."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        DangKyThi? record = await dbContext.DangKyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error("Registration not found."));
        }

        DangKyThi? payload = ReadBody<DangKyThi>(body, "dang_ky_thi");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid registration payload."));
        }

        record.KyThiID = payload.KyThiID;
        record.SinhVienID = payload.SinhVienID;
        record.SoBaoDanh = payload.SoBaoDanh;
        record.TrangThaiDangKy = payload.TrangThaiDangKy;
        record.CapNhatLuc = DateTime.Now;

        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Duplicate registration or exam number."));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        DangKyThi? record = await dbContext.DangKyThi.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error("Registration not found."));
        }

        dbContext.DangKyThi.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error("Cannot delete because this registration is already used in room assignment, seating, or attendance."));
        }
    }

    [HttpPatch("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        DangKyThi? record = await dbContext.DangKyThi.Include(item => item.KyThi).FirstOrDefaultAsync(item => item.DangKyThiID == id);
        if (record is null)
        {
            return NotFound(Error("Registration not found."));
        }

        if (record.KyThi?.TrangThai != "published")
        {
            return UnprocessableEntity(Error("Registration can only be cancelled before room assignment."));
        }

        record.TrangThaiDangKy = "cancelled";
        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    private async Task<string> GenerateSoBaoDanh(int kyThiID)
    {
        int nextNumber = await dbContext.DangKyThi.CountAsync(record => record.KyThiID == kyThiID) + 1;
        return $"SBD{kyThiID.ToString().PadLeft(3, '0')}{nextNumber.ToString().PadLeft(3, '0')}";
    }
}
