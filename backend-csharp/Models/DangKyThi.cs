using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class DangKyThi
{
    public int DangKyThiID { get; set; }
    public int KyThiID { get; set; }
    public int SinhVienID { get; set; }
    public string SoBaoDanh { get; set; } = string.Empty;
    public string TrangThaiDangKy { get; set; } = "registered";
    public DateTime NgayDangKy { get; set; }
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    public KyThi? KyThi { get; set; }
    public SinhVien? SinhVien { get; set; }
    [JsonIgnore] public PhanPhong? PhanPhong { get; set; }
    [JsonIgnore] public XepCho? XepCho { get; set; }
    [JsonIgnore] public DiemDanh? DiemDanh { get; set; }
}
