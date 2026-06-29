namespace backend_csharp.Models;

public class DiemDanh
{
    public int DiemDanhID { get; set; }
    public int DangKyThiID { get; set; }
    public int KyThiID { get; set; }
    public int PhongThiID { get; set; }
    public string TrangThai { get; set; } = "absent";
    public DateTime? ThoiGianCheckIn { get; set; }
    public int? NguoiGhiNhanID { get; set; }
    public string? GhiChu { get; set; }
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    public KyThi? KyThi { get; set; }
    public PhongThi? PhongThi { get; set; }
    public NguoiDung? NguoiGhiNhan { get; set; }
    public DangKyThi? DangKyThi { get; set; }
}
