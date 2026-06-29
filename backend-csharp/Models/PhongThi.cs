using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class PhongThi
{
    public int PhongThiID { get; set; }
    public string MaPhong { get; set; } = string.Empty;
    public string TenPhong { get; set; } = string.Empty;
    public string? ToaNha { get; set; }
    public int? Tang { get; set; }
    public int SucChua { get; set; }
    public int? SoHang { get; set; }
    public int? SoCot { get; set; }
    public bool TrangThai { get; set; } = true;
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    [JsonIgnore] public ICollection<PhanPhong> PhanPhongRecords { get; set; } = [];
    [JsonIgnore] public ICollection<XepCho> XepChoRecords { get; set; } = [];
    [JsonIgnore] public ICollection<DiemDanh> DiemDanhRecords { get; set; } = [];
}
