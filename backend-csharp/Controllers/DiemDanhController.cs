using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/diem_danh")]
public class DiemDanhController(ExamDbContext dbContext) : ApiControllerBase
{
    private static readonly HashSet<string> ValidStatuses = ["present", "absent", "late", "excused"];

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<DiemDanh> records = await QueryWithIncludes().OrderBy(record => record.DiemDanhID).ToListAsync();
        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        DiemDanh? record = await QueryWithIncludes().FirstOrDefaultAsync(item => item.DiemDanhID == id);
        return record is null ? NotFound(Error("Attendance record not found.")) : Ok(record);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        DiemDanh? record = ReadBody<DiemDanh>(body, "diem_danh");
        if (record is null)
        {
            return UnprocessableEntity(Errors("Invalid attendance payload."));
        }

        PhanPhong? phanPhong = await dbContext.PhanPhong.FirstOrDefaultAsync(item => item.DangKyThiID == record.DangKyThiID);
        if (phanPhong is null)
        {
            return NotFound(Error("Room assignment not found for this registration."));
        }

        string status = string.IsNullOrWhiteSpace(record.TrangThai) ? "absent" : record.TrangThai;
        if (!ValidStatuses.Contains(status))
        {
            return UnprocessableEntity(Error("Invalid attendance status."));
        }

        record.KyThiID = phanPhong.KyThiID;
        record.PhongThiID = phanPhong.PhongThiID;
        record.TrangThai = status;
        record.ThoiGianCheckIn ??= status is "present" or "late" ? DateTime.Now : null;

        dbContext.DiemDanh.Add(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return CreatedAtAction(nameof(Show), new { id = record.DiemDanhID }, record);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Attendance already exists for this registration."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        DiemDanh? record = await dbContext.DiemDanh.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error("Attendance record not found."));
        }

        DiemDanh? payload = ReadBody<DiemDanh>(body, "diem_danh");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid attendance payload."));
        }

        if (!string.IsNullOrWhiteSpace(payload.TrangThai) && !ValidStatuses.Contains(payload.TrangThai))
        {
            return UnprocessableEntity(Error("Invalid attendance status."));
        }

        record.DangKyThiID = payload.DangKyThiID == 0 ? record.DangKyThiID : payload.DangKyThiID;
        record.TrangThai = string.IsNullOrWhiteSpace(payload.TrangThai) ? record.TrangThai : payload.TrangThai;
        record.NguoiGhiNhanID = payload.NguoiGhiNhanID;
        record.GhiChu = payload.GhiChu;

        if (record.TrangThai is "present" or "late" && record.ThoiGianCheckIn is null)
        {
            record.ThoiGianCheckIn = DateTime.Now;
        }

        if (record.TrangThai is "absent" or "excused")
        {
            record.ThoiGianCheckIn = null;
        }

        if (payload.ThoiGianCheckIn.HasValue)
        {
            record.ThoiGianCheckIn = payload.ThoiGianCheckIn;
        }

        record.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
        return Ok(record);
    }

    private IQueryable<DiemDanh> QueryWithIncludes()
    {
        return dbContext.DiemDanh
            .Include(record => record.KyThi)
            .Include(record => record.PhongThi)
            .Include(record => record.DangKyThi)
                .ThenInclude(record => record!.SinhVien);
    }
}
