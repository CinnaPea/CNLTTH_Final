using backend_csharp.Models;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Data;

public class ExamDbContext(DbContextOptions<ExamDbContext> options) : DbContext(options)
{
    public DbSet<VaiTro> VaiTro => Set<VaiTro>();
    public DbSet<NguoiDung> NguoiDung => Set<NguoiDung>();
    public DbSet<SinhVien> SinhVien => Set<SinhVien>();
    public DbSet<MonThi> MonThi => Set<MonThi>();
    public DbSet<PhongThi> PhongThi => Set<PhongThi>();
    public DbSet<KyThi> KyThi => Set<KyThi>();
    public DbSet<DangKyThi> DangKyThi => Set<DangKyThi>();
    public DbSet<PhanPhong> PhanPhong => Set<PhanPhong>();
    public DbSet<XepCho> XepCho => Set<XepCho>();
    public DbSet<DiemDanh> DiemDanh => Set<DiemDanh>();
    public DbSet<NhatKy> NhatKy => Set<NhatKy>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<VaiTro>(entity =>
        {
            entity.ToTable("VaiTro", "dbo");
            entity.HasKey(e => e.VaiTroID);
            entity.HasIndex(e => e.TenVaiTro).IsUnique();
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
        });

        modelBuilder.Entity<NguoiDung>(entity =>
        {
            entity.ToTable("NguoiDung", "dbo");
            entity.HasKey(e => e.NguoiDungID);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.TrangThai).HasDefaultValue(true);
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.VaiTro).WithMany(e => e.NguoiDungs).HasForeignKey(e => e.VaiTroID);
        });

        modelBuilder.Entity<SinhVien>(entity =>
        {
            entity.ToTable("SinhVien", "dbo");
            entity.HasKey(e => e.SinhVienID);
            entity.HasIndex(e => e.MaSinhVien).IsUnique();
            entity.Property(e => e.TrangThai).HasDefaultValue(true);
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.NguoiDung).WithOne(e => e.SinhVien).HasForeignKey<SinhVien>(e => e.NguoiDungID);
        });

        modelBuilder.Entity<MonThi>(entity =>
        {
            entity.ToTable("MonThi", "dbo");
            entity.HasKey(e => e.MonThiID);
            entity.HasIndex(e => e.MaMon).IsUnique();
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
        });

        modelBuilder.Entity<PhongThi>(entity =>
        {
            entity.ToTable("PhongThi", "dbo");
            entity.HasKey(e => e.PhongThiID);
            entity.HasIndex(e => e.MaPhong).IsUnique();
            entity.Property(e => e.TrangThai).HasDefaultValue(true);
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
        });

        modelBuilder.Entity<KyThi>(entity =>
        {
            entity.ToTable("KyThi", "dbo");
            entity.HasKey(e => e.KyThiID);
            entity.HasIndex(e => e.MaKyThi).IsUnique();
            entity.Property(e => e.TrangThai).HasDefaultValue("draft");
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.MonThi).WithMany(e => e.KyThiRecords).HasForeignKey(e => e.MonThiID);
        });

        modelBuilder.Entity<DangKyThi>(entity =>
        {
            entity.ToTable("DangKyThi", "dbo");
            entity.HasKey(e => e.DangKyThiID);
            entity.HasIndex(e => new { e.KyThiID, e.SinhVienID }).IsUnique();
            entity.HasIndex(e => e.SoBaoDanh).IsUnique();
            entity.Property(e => e.TrangThaiDangKy).HasDefaultValue("registered");
            entity.Property(e => e.NgayDangKy).HasDefaultValueSql("SYSDATETIME()");
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.KyThi).WithMany(e => e.DangKyThiRecords).HasForeignKey(e => e.KyThiID);
            entity.HasOne(e => e.SinhVien).WithMany(e => e.DangKyThiRecords).HasForeignKey(e => e.SinhVienID);
        });

        modelBuilder.Entity<PhanPhong>(entity =>
        {
            entity.ToTable("PhanPhong", "dbo");
            entity.HasKey(e => e.PhanPhongID);
            entity.HasIndex(e => e.DangKyThiID).IsUnique();
            entity.Property(e => e.ThoiDiemPhan).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.DangKyThi).WithOne(e => e.PhanPhong).HasForeignKey<PhanPhong>(e => e.DangKyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.KyThi).WithMany(e => e.PhanPhongRecords).HasForeignKey(e => e.KyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PhongThi).WithMany(e => e.PhanPhongRecords).HasForeignKey(e => e.PhongThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.NguoiPhan).WithMany(e => e.PhanPhongRecords).HasForeignKey(e => e.NguoiPhanID).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<XepCho>(entity =>
        {
            entity.ToTable("XepCho", "dbo");
            entity.HasKey(e => e.XepChoID);
            entity.HasIndex(e => e.DangKyThiID).IsUnique();
            entity.HasIndex(e => new { e.KyThiID, e.PhongThiID, e.SoCho }).IsUnique();
            entity.Property(e => e.ThoiDiemXep).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.DangKyThi).WithOne(e => e.XepCho).HasForeignKey<XepCho>(e => e.DangKyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.KyThi).WithMany(e => e.XepChoRecords).HasForeignKey(e => e.KyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PhongThi).WithMany(e => e.XepChoRecords).HasForeignKey(e => e.PhongThiID).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DiemDanh>(entity =>
        {
            entity.ToTable("DiemDanh", "dbo");
            entity.HasKey(e => e.DiemDanhID);
            entity.HasIndex(e => e.DangKyThiID).IsUnique();
            entity.Property(e => e.TaoLuc).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.DangKyThi).WithOne(e => e.DiemDanh).HasForeignKey<DiemDanh>(e => e.DangKyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.KyThi).WithMany(e => e.DiemDanhRecords).HasForeignKey(e => e.KyThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.PhongThi).WithMany(e => e.DiemDanhRecords).HasForeignKey(e => e.PhongThiID).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.NguoiGhiNhan).WithMany(e => e.DiemDanhRecords).HasForeignKey(e => e.NguoiGhiNhanID).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<NhatKy>(entity =>
        {
            entity.ToTable("NhatKy", "dbo");
            entity.HasKey(e => e.NhatKyID);
            entity.Property(e => e.ThoiGian).HasDefaultValueSql("SYSDATETIME()");
            entity.HasOne(e => e.NguoiDung).WithMany(e => e.NhatKyRecords).HasForeignKey(e => e.NguoiDungID);
        });
    }
}
