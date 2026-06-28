namespace backend_csharp.Models;

public class PhanPhong
{
    public int PhanPhongID { get; set; }
    public int DangKyThiID { get; set; }
    public int KyThiID { get; set; }
    public int PhongThiID { get; set; }
    public int? NguoiPhanID { get; set; }
    public DateTime ThoiDiemPhan { get; set; }
    public KyThi? KyThi { get; set; }
    public PhongThi? PhongThi { get; set; }
    public NguoiDung? NguoiPhan { get; set; }
    public DangKyThi? DangKyThi { get; set; }
}
