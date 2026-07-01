using backend_csharp.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/nhat_ky")]
public class NhatKyController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Index([FromQuery(Name = "user_id")] int? userId)
    {
        var currentUser = await GetCurrentUser();
        if (currentUser is null)
        {
            return Unauthorized(Error("Không xác định được người dùng đang đăng nhập."));
        }

        bool isAdmin = currentUser.VaiTro?.TenVaiTro == "Admin";
        var query = dbContext.NhatKy
            .Include(record => record.NguoiDung)
                .ThenInclude(user => user!.VaiTro)
            .AsQueryable();

        if (isAdmin)
        {
            if (userId is > 0)
            {
                query = query.Where(record => record.NguoiDungID == userId);
            }
        }
        else
        {
            query = query.Where(record => record.NguoiDungID == currentUser.NguoiDungID);
        }

        var records = await query
            .OrderByDescending(record => record.ThoiGian)
            .Select(record => new
            {
                record.NhatKyID,
                record.NguoiDungID,
                HoTen = record.NguoiDung != null ? record.NguoiDung.HoTen : null,
                VaiTro = record.NguoiDung != null && record.NguoiDung.VaiTro != null ? record.NguoiDung.VaiTro.TenVaiTro : null,
                NguoiDung = record.NguoiDung == null ? null : new
                {
                    record.NguoiDung.NguoiDungID,
                    record.NguoiDung.HoTen,
                    record.NguoiDung.Email,
                    TenVaiTro = record.NguoiDung.VaiTro != null ? record.NguoiDung.VaiTro.TenVaiTro : null,
                },
                record.HanhDong,
                record.LoaiDoiTuong,
                record.DoiTuongID,
                record.MoTa,
                record.ThoiGian,
            })
            .ToListAsync();

        return Ok(records);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Show(int id)
    {
        var currentUser = await GetCurrentUser();
        if (currentUser is null)
        {
            return Unauthorized(Error("Không xác định được người dùng đang đăng nhập."));
        }

        bool isAdmin = currentUser.VaiTro?.TenVaiTro == "Admin";
        var query = dbContext.NhatKy
            .Include(item => item.NguoiDung)
                .ThenInclude(user => user!.VaiTro)
            .Where(item => item.NhatKyID == id);

        if (!isAdmin)
        {
            query = query.Where(item => item.NguoiDungID == currentUser.NguoiDungID);
        }

        var record = await query
            .Select(item => new
            {
                item.NhatKyID,
                item.NguoiDungID,
                HoTen = item.NguoiDung != null ? item.NguoiDung.HoTen : null,
                VaiTro = item.NguoiDung != null && item.NguoiDung.VaiTro != null ? item.NguoiDung.VaiTro.TenVaiTro : null,
                item.HanhDong,
                item.LoaiDoiTuong,
                item.DoiTuongID,
                item.MoTa,
                item.ThoiGian,
            })
            .FirstOrDefaultAsync();

        return record is null ? NotFound(Error($"Log with ID {id} was not found.")) : Ok(record);
    }

    private async Task<backend_csharp.Models.NguoiDung?> GetCurrentUser()
    {
        string? rawUserId = Request.Headers["X-User-Id"].FirstOrDefault();
        if (!int.TryParse(rawUserId, out int currentUserId) || currentUserId <= 0)
        {
            return null;
        }

        return await dbContext.NguoiDung
            .Include(user => user.VaiTro)
            .FirstOrDefaultAsync(user => user.NguoiDungID == currentUserId && user.TrangThai);
    }
}
