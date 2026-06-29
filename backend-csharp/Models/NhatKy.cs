using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class NhatKy
{
    public int NhatKyID { get; set; }
    public int? NguoiDungID { get; set; }
    public string HanhDong { get; set; } = string.Empty;
    public string LoaiDoiTuong { get; set; } = string.Empty;
    public int DoiTuongID { get; set; }
    public string? MoTa { get; set; }
    public DateTime ThoiGian { get; set; }
    [JsonIgnore] public NguoiDung? NguoiDung { get; set; }
}
