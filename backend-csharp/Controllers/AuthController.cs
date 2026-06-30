using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/auth")]
public class AuthController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginPayload payload)
    {
        string identifier = (payload.Identifier ?? payload.Email ?? string.Empty).Trim().ToLowerInvariant();
        NguoiDung? user = await dbContext.NguoiDung
            .Include(record => record.VaiTro)
            .Include(record => record.SinhVien)
            .FirstOrDefaultAsync(record => record.Email.ToLower() == identifier);

        if (user is null || !user.TrangThai || !PasswordMatches(user, payload.Password))
        {
            return Unauthorized(Error("Email or password is incorrect."));
        }

        return Ok(SessionPayload(user, "csharp-auth"));
    }

    [HttpPost("signup")]
    public async Task<IActionResult> Signup([FromBody] SignupPayload payload)
    {
        int roleId = payload.VaiTroID <= 0 ? 4 : payload.VaiTroID;
        string code = FirstPresent(payload.MaDinhDanh, payload.MaSinhVien, await NextCode(roleId));
        NguoiDung user = new()
        {
            Email = payload.Email.Trim().ToLowerInvariant(),
            HoTen = string.IsNullOrWhiteSpace(payload.HoTen) ? payload.Email : payload.HoTen.Trim(),
            MatKhauHash = NguoiDungController.NormalizePassword(payload.MatKhau),
            VaiTroID = roleId,
            TrangThai = true,
            TaoLuc = DateTime.Now
        };

        dbContext.NguoiDung.Add(user);
        try
        {
            await dbContext.SaveChangesAsync();
            if (roleId == 4)
            {
                dbContext.SinhVien.Add(new SinhVien
                {
                    NguoiDungID = user.NguoiDungID,
                    MaSinhVien = code,
                    HoTen = user.HoTen,
                    Email = user.Email,
                    TrangThai = true,
                    TaoLuc = DateTime.Now
                });
                await dbContext.SaveChangesAsync();
            }

            await dbContext.Entry(user).Reference(record => record.VaiTro).LoadAsync();
            await dbContext.Entry(user).Reference(record => record.SinhVien).LoadAsync();
            Dictionary<string, object?> response = SessionPayload(user, "csharp-auth-signup");
            response["generatedCode"] = code;
            return Created("/api/v1/auth/signup", response);
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            return Conflict(Error("Email or generated code already exists."));
        }
    }

    private static bool PasswordMatches(NguoiDung user, string password)
    {
        string plain = user.MatKhauHash.StartsWith("hashed_", StringComparison.Ordinal) ? user.MatKhauHash[7..] : user.MatKhauHash;
        return user.MatKhauHash == password || plain == password;
    }

    private async Task<string> NextCode(int roleId)
    {
        string prefix = roleId == 2 ? "CBDT" : roleId == 3 ? "CBKT" : "SV";
        List<string> codes = await dbContext.SinhVien
            .Where(record => record.MaSinhVien.StartsWith(prefix))
            .Select(record => record.MaSinhVien)
            .ToListAsync();

        int nextNumber = codes
            .Select(code => new string(code.Where(char.IsDigit).ToArray()))
            .Select(number => int.TryParse(number, out int parsed) ? parsed : 0)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return $"{prefix}{nextNumber.ToString().PadLeft(3, '0')}";
    }

    private static string FirstPresent(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))!.Trim();
    }

    private static Dictionary<string, object?> SessionPayload(NguoiDung user, string source) => new()
    {
        ["token"] = $"csharp-{user.NguoiDungID}-{user.VaiTro?.TenVaiTro}",
        ["authSource"] = source,
        ["user"] = NguoiDungController.SerializeUser(user)
    };

    public sealed class LoginPayload
    {
        public string? Identifier { get; set; }
        public string? Email { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    public sealed class SignupPayload
    {
        public string HoTen { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MatKhau { get; set; } = string.Empty;
        public int VaiTroID { get; set; } = 4;
        public string? MaDinhDanh { get; set; }
        public string? MaSinhVien { get; set; }
    }
}
