namespace backend_csharp.Models;

public class XepCho
{
    public int XepChoID { get; set; }
    public int DangKyThiID { get; set; }
    public int KyThiID { get; set; }
    public int PhongThiID { get; set; }
    public string SoCho { get; set; } = string.Empty;
    public int? Hang { get; set; }
    public int? Cot { get; set; }
    public DateTime ThoiDiemXep { get; set; }
    public KyThi? KyThi { get; set; }
    public PhongThi? PhongThi { get; set; }
    public DangKyThi? DangKyThi { get; set; }
}
