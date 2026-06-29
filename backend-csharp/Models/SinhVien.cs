using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class SinhVien
{
    public int SinhVienID { get; set; }
    public string MaSinhVien { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public string? Lop { get; set; }
    public string? Email { get; set; }
    public string? DienThoai { get; set; }
    public bool TrangThai { get; set; } = true;
    public int? NguoiDungID { get; set; }
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    [JsonIgnore] public NguoiDung? NguoiDung { get; set; }
    [JsonIgnore] public ICollection<DangKyThi> DangKyThiRecords { get; set; } = [];
}
