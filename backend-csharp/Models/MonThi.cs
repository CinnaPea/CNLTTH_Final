using System.Text.Json.Serialization;

namespace backend_csharp.Models;

public class MonThi
{
    public int MonThiID { get; set; }
    public string MaMon { get; set; } = string.Empty;
    public string TenMon { get; set; } = string.Empty;
    public DateTime TaoLuc { get; set; }
    public DateTime? CapNhatLuc { get; set; }
    [JsonIgnore] public ICollection<KyThi> KyThiRecords { get; set; } = [];
}
