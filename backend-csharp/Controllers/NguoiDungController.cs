using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/nguoi_dung")]
public class NguoiDungController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        List<NguoiDung> records = await dbContext.NguoiDung
            .Include(record => record.VaiTro)
            .Include(record => record.SinhVien)
            .OrderBy(record => record.NguoiDungID)
            .ToListAsync();

        return Ok(records.Select(SerializeUser));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        NguoiDung? record = await dbContext.NguoiDung
            .Include(user => user.VaiTro)
            .Include(user => user.SinhVien)
            .FirstOrDefaultAsync(user => user.NguoiDungID == id);

        return record is null ? NotFound(Error($"User with ID {id} was not found.")) : Ok(SerializeUser(record));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] JsonElement body)
    {
        AccountPayload? payload = ReadBody<AccountPayload>(body, "nguoi_dung");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid user payload."));
        }

        NguoiDung record = new()
        {
            Email = payload.Email.Trim().ToLowerInvariant(),
            HoTen = string.IsNullOrWhiteSpace(payload.HoTen) ? payload.Email : payload.HoTen.Trim(),
            MatKhauHash = NormalizePassword(payload.MatKhau ?? payload.MatKhauHash),
            VaiTroID = payload.VaiTroID <= 0 ? 4 : payload.VaiTroID,
            TrangThai = payload.StatusAsBool(),
            TaoLuc = DateTime.Now
        };

        dbContext.NguoiDung.Add(record);
        try
        {
            await dbContext.SaveChangesAsync();
            await SyncStudentCode(record, payload.MaSinhVien ?? payload.MaDinhDanh);
            await dbContext.Entry(record).Reference(user => user.VaiTro).LoadAsync();
            await dbContext.Entry(record).Reference(user => user.SinhVien).LoadAsync();
            return CreatedAtAction(nameof(Show), new { id = record.NguoiDungID }, SerializeUser(record));
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Email or generated student code already exists."));
        }
    }

    [HttpPatch("{id:int}")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] JsonElement body)
    {
        NguoiDung? record = await dbContext.NguoiDung.Include(user => user.SinhVien).FirstOrDefaultAsync(user => user.NguoiDungID == id);
        if (record is null)
        {
            return NotFound(Error($"User with ID {id} was not found."));
        }

        AccountPayload? payload = ReadBody<AccountPayload>(body, "nguoi_dung");
        if (payload is null)
        {
            return UnprocessableEntity(Errors("Invalid user payload."));
        }

        record.Email = payload.Email.Trim().ToLowerInvariant();
        record.HoTen = string.IsNullOrWhiteSpace(payload.HoTen) ? payload.Email : payload.HoTen.Trim();
        record.VaiTroID = payload.VaiTroID <= 0 ? record.VaiTroID : payload.VaiTroID;
        record.TrangThai = payload.StatusAsBool(record.TrangThai);
        record.CapNhatLuc = DateTime.Now;
        if (!string.IsNullOrWhiteSpace(payload.MatKhau))
        {
            record.MatKhauHash = NormalizePassword(payload.MatKhau);
        }

        try
        {
            await dbContext.SaveChangesAsync();
            await SyncStudentCode(record, payload.MaSinhVien ?? payload.MaDinhDanh);
            await dbContext.Entry(record).Reference(user => user.VaiTro).LoadAsync();
            await dbContext.Entry(record).Reference(user => user.SinhVien).LoadAsync();
            return Ok(SerializeUser(record));
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Email or generated student code already exists."));
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Destroy(int id)
    {
        NguoiDung? record = await dbContext.NguoiDung.FindAsync(id);
        if (record is null)
        {
            return NotFound(Error($"User with ID {id} was not found."));
        }

        dbContext.NguoiDung.Remove(record);
        try
        {
            await dbContext.SaveChangesAsync();
            return Ok(new { message = $"Deleted user with ID {record.NguoiDungID}." });
        }
        catch (DbUpdateException)
        {
            return Conflict(Error($"Cannot delete user with ID {record.NguoiDungID} because the user is referenced by exam data."));
        }
    }

    internal static object SerializeUser(NguoiDung user) => new
    {
        user.NguoiDungID,
        user.Email,
        user.MatKhauHash,
        user.HoTen,
        user.VaiTroID,
        TenVaiTro = user.VaiTro?.TenVaiTro,
        TrangThai = user.TrangThai ? 1 : 0,
        MaSinhVien = user.SinhVien?.MaSinhVien,
        user.TaoLuc,
        user.CapNhatLuc
    };

    internal static string NormalizePassword(string? value)
    {
        string text = (value ?? string.Empty).Trim();
        return text.StartsWith("hashed_", StringComparison.Ordinal) ? text : $"hashed_{text}";
    }

    private async Task SyncStudentCode(NguoiDung user, string? code)
    {
        string text = (code ?? string.Empty).Trim();
        if (user.VaiTroID != 4 || string.IsNullOrWhiteSpace(text))
        {
            return;
        }

        SinhVien? student = await dbContext.SinhVien.FirstOrDefaultAsync(record => record.NguoiDungID == user.NguoiDungID)
            ?? await dbContext.SinhVien.FirstOrDefaultAsync(record => record.MaSinhVien == text);

        if (student is null)
        {
            student = new SinhVien { MaSinhVien = text, TaoLuc = DateTime.Now };
            dbContext.SinhVien.Add(student);
        }

        student.NguoiDungID = user.NguoiDungID;
        student.MaSinhVien = text;
        student.HoTen = user.HoTen;
        student.Email = user.Email;
        student.TrangThai = user.TrangThai;
        student.CapNhatLuc = DateTime.Now;
        await dbContext.SaveChangesAsync();
    }

    public sealed class AccountPayload
    {
        public string Email { get; set; } = string.Empty;
        public string HoTen { get; set; } = string.Empty;
        public string? MatKhau { get; set; }
        public string? MatKhauHash { get; set; }
        public int VaiTroID { get; set; } = 4;
        public JsonElement TrangThai { get; set; }
        public string? MaSinhVien { get; set; }
        public string? MaDinhDanh { get; set; }

        public bool StatusAsBool(bool fallback = true)
        {
            return TrangThai.ValueKind switch
            {
                JsonValueKind.False => false,
                JsonValueKind.True => true,
                JsonValueKind.Number => TrangThai.GetInt32() == 1,
                JsonValueKind.String => TrangThai.GetString() == "1" || string.Equals(TrangThai.GetString(), "true", StringComparison.OrdinalIgnoreCase),
                _ => fallback
            };
        }
    }
}
