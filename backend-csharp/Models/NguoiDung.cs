using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class NguoiDung
{
    public int NguoiDungID { get; set; }
    public string Email { get; set; } = string.Empty;
    public string MatKhauHash { get; set; } = string.Empty;
    public string HoTen { get; set; } = string.Empty;
    public int VaiTroID { get; set; }
    public bool TrangThai { get; set; } = true;
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    [JsonIgnore] public VaiTro? VaiTro { get; set; }
    [JsonIgnore] public SinhVien? SinhVien { get; set; }
    [JsonIgnore] public ICollection<PhanPhong> PhanPhongRecords { get; set; } = [];
    [JsonIgnore] public ICollection<DiemDanh> DiemDanhRecords { get; set; } = [];
    [JsonIgnore] public ICollection<NhatKy> NhatKyRecords { get; set; } = [];
}
