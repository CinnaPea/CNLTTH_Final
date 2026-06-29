using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class VaiTro
{
    public int VaiTroID { get; set; }
    public string TenVaiTro { get; set; } = string.Empty;
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    [JsonIgnore] public ICollection<NguoiDung> NguoiDungs { get; set; } = [];
}
