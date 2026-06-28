using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class KyThi
{
    public int KyThiID { get; set; }
    public string MaKyThi { get; set; } = string.Empty;
    public string TenKyThi { get; set; } = string.Empty;
    public int MonThiID { get; set; }
    public DateOnly NgayThi { get; set; }
    public TimeOnly GioBatDau { get; set; }
    public TimeOnly GioKetThuc { get; set; }
    public DateTime? ThoiHanDangKyDen { get; set; }
    public string TrangThai { get; set; } = "draft";
    public string? MoTa { get; set; }
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    public MonThi? MonThi { get; set; }
    [JsonIgnore] public ICollection<DangKyThi> DangKyThiRecords { get; set; } = [];
    [JsonIgnore] public ICollection<XepCho> XepChoRecords { get; set; } = [];
    [JsonIgnore] public ICollection<PhanPhong> PhanPhongRecords { get; set; } = [];
    [JsonIgnore] public ICollection<DiemDanh> DiemDanhRecords { get; set; } = [];
}
