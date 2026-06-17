/* =========================================================
   CNLTTH - HE THONG TO CHUC KY THI TRUC TUYEN
   Scope: Phan phong, xep cho, diem danh
   Final consolidated SQL script
   Version: no-single-user reset script
========================================================= */

USE master;
GO

IF DB_ID(N'CNLTTH_HeThongToChucKyThi') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE CNLTTH_HeThongToChucKyThi');
END
GO

USE CNLTTH_HeThongToChucKyThi;
GO

/* =========================================================
   DROP VIEWS FIRST
========================================================= */
DROP VIEW IF EXISTS dbo.vw_TongHopDiemDanh;
DROP VIEW IF EXISTS dbo.vw_MB04_BangDiemDanh;
DROP VIEW IF EXISTS dbo.vw_MB03_SoDoXepChoNgoi;
DROP VIEW IF EXISTS dbo.vw_MB02_PhieuPhanPhongThi;
DROP VIEW IF EXISTS dbo.vw_MB01_DanhSachSinhVienDangKyThi;
GO

/* =========================================================
   DROP TABLES (child -> parent)
========================================================= */
DROP TABLE IF EXISTS dbo.NhatKy;
DROP TABLE IF EXISTS dbo.DiemDanh;
DROP TABLE IF EXISTS dbo.XepCho;
DROP TABLE IF EXISTS dbo.PhanPhong;
DROP TABLE IF EXISTS dbo.DangKyThi;
DROP TABLE IF EXISTS dbo.KyThi;
DROP TABLE IF EXISTS dbo.PhongThi;
DROP TABLE IF EXISTS dbo.MonThi;
DROP TABLE IF EXISTS dbo.SinhVien;
DROP TABLE IF EXISTS dbo.NguoiDung;
DROP TABLE IF EXISTS dbo.VaiTro;
GO

/* =========================================================
   1. VAI TRO
========================================================= */
CREATE TABLE dbo.VaiTro (
    VaiTroID INT IDENTITY(1,1) PRIMARY KEY,
    TenVaiTro NVARCHAR(50) NOT NULL,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_VaiTro_TenVaiTro UNIQUE (TenVaiTro)
);
GO

/* =========================================================
   2. NGUOI DUNG
========================================================= */
CREATE TABLE dbo.NguoiDung (
    NguoiDungID INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(100) NOT NULL,
    MatKhauHash NVARCHAR(255) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    VaiTroID INT NOT NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_NguoiDung_Email UNIQUE (Email),
    CONSTRAINT FK_NguoiDung_VaiTro
        FOREIGN KEY (VaiTroID) REFERENCES dbo.VaiTro(VaiTroID)
);
GO

/* =========================================================
   3. SINH VIEN
========================================================= */
CREATE TABLE dbo.SinhVien (
    SinhVienID INT IDENTITY(1,1) PRIMARY KEY,
    MaSinhVien NVARCHAR(20) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Lop NVARCHAR(50) NULL,
    Email NVARCHAR(100) NULL,
    DienThoai NVARCHAR(20) NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NguoiDungID INT NULL,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_SinhVien_MaSinhVien UNIQUE (MaSinhVien),
    CONSTRAINT FK_SinhVien_NguoiDung
        FOREIGN KEY (NguoiDungID) REFERENCES dbo.NguoiDung(NguoiDungID)
);
GO

-- Optional 1-1 mapping: one NguoiDung can belong to at most one SinhVien.
-- Filtered unique index allows many students without login accounts (NguoiDungID IS NULL).
CREATE UNIQUE INDEX UX_SinhVien_NguoiDungID_NotNull
ON dbo.SinhVien(NguoiDungID)
WHERE NguoiDungID IS NOT NULL;
GO

/* =========================================================
   4. MON THI
========================================================= */
CREATE TABLE dbo.MonThi (
    MonThiID INT IDENTITY(1,1) PRIMARY KEY,
    MaMon NVARCHAR(20) NOT NULL,
    TenMon NVARCHAR(100) NOT NULL,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_MonThi_MaMon UNIQUE (MaMon)
);
GO

/* =========================================================
   5. PHONG THI
   - SoHang / SoCot support MB.03 seating grid
========================================================= */
CREATE TABLE dbo.PhongThi (
    PhongThiID INT IDENTITY(1,1) PRIMARY KEY,
    MaPhong NVARCHAR(20) NOT NULL,
    TenPhong NVARCHAR(100) NOT NULL,
    ToaNha NVARCHAR(100) NULL,
    Tang INT NULL,
    SucChua INT NOT NULL,
    SoHang INT NULL,
    SoCot INT NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_PhongThi_MaPhong UNIQUE (MaPhong),
    CONSTRAINT CK_PhongThi_SucChua CHECK (SucChua > 0),
    CONSTRAINT CK_PhongThi_Tang CHECK (Tang IS NULL OR Tang >= 0),
    CONSTRAINT CK_PhongThi_SoHang CHECK (SoHang IS NULL OR SoHang > 0),
    CONSTRAINT CK_PhongThi_SoCot CHECK (SoCot IS NULL OR SoCot > 0)
);
GO

/* =========================================================
   6. KY THI
   - ThoiHanDangKyDen supports MB.01
========================================================= */
CREATE TABLE dbo.KyThi (
    KyThiID INT IDENTITY(1,1) PRIMARY KEY,
    MaKyThi NVARCHAR(30) NOT NULL,
    TenKyThi NVARCHAR(150) NOT NULL,
    MonThiID INT NOT NULL,
    NgayThi DATE NOT NULL,
    GioBatDau TIME NOT NULL,
    GioKetThuc TIME NOT NULL,
    ThoiHanDangKyDen DATETIME2 NULL,
    TrangThai NVARCHAR(30) NOT NULL DEFAULT N'draft',
    MoTa NVARCHAR(500) NULL,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT UQ_KyThi_MaKyThi UNIQUE (MaKyThi),
    CONSTRAINT FK_KyThi_MonThi
        FOREIGN KEY (MonThiID) REFERENCES dbo.MonThi(MonThiID),
    CONSTRAINT CK_KyThi_TrangThai CHECK (
        TrangThai IN (
            N'draft',
            N'published',
            N'room_assigned',
            N'seat_assigned',
            N'attendance_open',
            N'closed'
        )
    ),
    CONSTRAINT CK_KyThi_ThoiGian CHECK (GioKetThuc > GioBatDau)
);
GO

/* =========================================================
   7. DANG KY THI
   - Backbone transaction table
   - NgayDangKy supports MB.01
========================================================= */
CREATE TABLE dbo.DangKyThi (
    DangKyThiID INT IDENTITY(1,1) PRIMARY KEY,
    KyThiID INT NOT NULL,
    SinhVienID INT NOT NULL,
    SoBaoDanh NVARCHAR(30) NOT NULL,
    TrangThaiDangKy NVARCHAR(30) NOT NULL DEFAULT N'registered',
    NgayDangKy DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT FK_DangKyThi_KyThi
        FOREIGN KEY (KyThiID) REFERENCES dbo.KyThi(KyThiID),
    CONSTRAINT FK_DangKyThi_SinhVien
        FOREIGN KEY (SinhVienID) REFERENCES dbo.SinhVien(SinhVienID),

    CONSTRAINT UQ_DangKyThi_KyThi_SinhVien UNIQUE (KyThiID, SinhVienID),
    CONSTRAINT UQ_DangKyThi_SoBaoDanh UNIQUE (SoBaoDanh),

    -- Supports composite FK from PhanPhong.
    CONSTRAINT UQ_DangKyThi_ID_KyThi UNIQUE (DangKyThiID, KyThiID),

    CONSTRAINT CK_DangKyThi_TrangThai CHECK (
        TrangThaiDangKy IN (N'registered', N'cancelled')
    )
);
GO

/* =========================================================
   8. PHAN PHONG
   - Controlled denormalization: repeats KyThiID for easier filtering/reporting
   - Composite FK prevents KyThiID mismatch with DangKyThi
========================================================= */
CREATE TABLE dbo.PhanPhong (
    PhanPhongID INT IDENTITY(1,1) PRIMARY KEY,
    DangKyThiID INT NOT NULL,
    KyThiID INT NOT NULL,
    PhongThiID INT NOT NULL,
    NguoiPhanID INT NULL,
    ThoiDiemPhan DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_PhanPhong_DangKyThi
        FOREIGN KEY (DangKyThiID) REFERENCES dbo.DangKyThi(DangKyThiID),
    CONSTRAINT FK_PhanPhong_DangKyThi_KyThi
        FOREIGN KEY (DangKyThiID, KyThiID) REFERENCES dbo.DangKyThi(DangKyThiID, KyThiID),
    CONSTRAINT FK_PhanPhong_KyThi
        FOREIGN KEY (KyThiID) REFERENCES dbo.KyThi(KyThiID),
    CONSTRAINT FK_PhanPhong_PhongThi
        FOREIGN KEY (PhongThiID) REFERENCES dbo.PhongThi(PhongThiID),
    CONSTRAINT FK_PhanPhong_NguoiDung
        FOREIGN KEY (NguoiPhanID) REFERENCES dbo.NguoiDung(NguoiDungID),

    CONSTRAINT UQ_PhanPhong_DangKyThi UNIQUE (DangKyThiID),

    -- Supports composite FK from XepCho and DiemDanh.
    CONSTRAINT UQ_PhanPhong_DangKy_KyThi_Phong
        UNIQUE (DangKyThiID, KyThiID, PhongThiID)
);
GO

/* =========================================================
   9. XEP CHO
   - Controlled denormalization: repeats KyThiID, PhongThiID
   - Composite FK forces seat to stay inside the assigned room
========================================================= */
CREATE TABLE dbo.XepCho (
    XepChoID INT IDENTITY(1,1) PRIMARY KEY,
    DangKyThiID INT NOT NULL,
    KyThiID INT NOT NULL,
    PhongThiID INT NOT NULL,
    SoCho NVARCHAR(20) NOT NULL,
    Hang INT NULL,
    Cot INT NULL,
    ThoiDiemXep DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_XepCho_DangKyThi
        FOREIGN KEY (DangKyThiID) REFERENCES dbo.DangKyThi(DangKyThiID),
    CONSTRAINT FK_XepCho_PhanPhong
        FOREIGN KEY (DangKyThiID, KyThiID, PhongThiID)
        REFERENCES dbo.PhanPhong(DangKyThiID, KyThiID, PhongThiID),
    CONSTRAINT FK_XepCho_KyThi
        FOREIGN KEY (KyThiID) REFERENCES dbo.KyThi(KyThiID),
    CONSTRAINT FK_XepCho_PhongThi
        FOREIGN KEY (PhongThiID) REFERENCES dbo.PhongThi(PhongThiID),

    CONSTRAINT UQ_XepCho_DangKyThi UNIQUE (DangKyThiID),
    CONSTRAINT UQ_XepCho_KyThi_PhongThi_SoCho UNIQUE (KyThiID, PhongThiID, SoCho),

    CONSTRAINT CK_XepCho_Hang CHECK (Hang IS NULL OR Hang > 0),
    CONSTRAINT CK_XepCho_Cot CHECK (Cot IS NULL OR Cot > 0)
);
GO

/* =========================================================
   10. DIEM DANH
   - Controlled denormalization: repeats KyThiID, PhongThiID
   - Composite FK forces attendance to stay inside the assigned room
========================================================= */
CREATE TABLE dbo.DiemDanh (
    DiemDanhID INT IDENTITY(1,1) PRIMARY KEY,
    DangKyThiID INT NOT NULL,
    KyThiID INT NOT NULL,
    PhongThiID INT NOT NULL,
    TrangThai NVARCHAR(20) NOT NULL,
    ThoiGianCheckIn DATETIME2 NULL,
    NguoiGhiNhanID INT NULL,
    GhiChu NVARCHAR(500) NULL,
    TaoLuc DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CapNhatLuc DATETIME2 NULL,

    CONSTRAINT FK_DiemDanh_DangKyThi
        FOREIGN KEY (DangKyThiID) REFERENCES dbo.DangKyThi(DangKyThiID),
    CONSTRAINT FK_DiemDanh_PhanPhong
        FOREIGN KEY (DangKyThiID, KyThiID, PhongThiID)
        REFERENCES dbo.PhanPhong(DangKyThiID, KyThiID, PhongThiID),
    CONSTRAINT FK_DiemDanh_KyThi
        FOREIGN KEY (KyThiID) REFERENCES dbo.KyThi(KyThiID),
    CONSTRAINT FK_DiemDanh_PhongThi
        FOREIGN KEY (PhongThiID) REFERENCES dbo.PhongThi(PhongThiID),
    CONSTRAINT FK_DiemDanh_NguoiDung
        FOREIGN KEY (NguoiGhiNhanID) REFERENCES dbo.NguoiDung(NguoiDungID),

    CONSTRAINT UQ_DiemDanh_DangKyThi UNIQUE (DangKyThiID),

    CONSTRAINT CK_DiemDanh_TrangThai CHECK (
        TrangThai IN (N'present', N'absent', N'late', N'excused')
    )
);
GO

/* =========================================================
   11. NHAT KY
========================================================= */
CREATE TABLE dbo.NhatKy (
    NhatKyID INT IDENTITY(1,1) PRIMARY KEY,
    NguoiDungID INT NULL,
    HanhDong NVARCHAR(100) NOT NULL,
    LoaiDoiTuong NVARCHAR(100) NOT NULL,
    DoiTuongID INT NOT NULL,
    MoTa NVARCHAR(1000) NULL,
    ThoiGian DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_NhatKy_NguoiDung
        FOREIGN KEY (NguoiDungID) REFERENCES dbo.NguoiDung(NguoiDungID)
);
GO

/* =========================================================
   INDEXES
========================================================= */
CREATE INDEX IX_NguoiDung_VaiTroID ON dbo.NguoiDung(VaiTroID);

CREATE INDEX IX_DangKyThi_KyThiID ON dbo.DangKyThi(KyThiID);
CREATE INDEX IX_DangKyThi_SinhVienID ON dbo.DangKyThi(SinhVienID);
CREATE INDEX IX_DangKyThi_KyThi_TrangThai ON dbo.DangKyThi(KyThiID, TrangThaiDangKy);

CREATE INDEX IX_PhanPhong_KyThiID ON dbo.PhanPhong(KyThiID);
CREATE INDEX IX_PhanPhong_PhongThiID ON dbo.PhanPhong(PhongThiID);
CREATE INDEX IX_PhanPhong_KyThi_PhongThi ON dbo.PhanPhong(KyThiID, PhongThiID);

CREATE INDEX IX_XepCho_KyThiID ON dbo.XepCho(KyThiID);
CREATE INDEX IX_XepCho_PhongThiID ON dbo.XepCho(PhongThiID);
CREATE INDEX IX_XepCho_KyThi_PhongThi ON dbo.XepCho(KyThiID, PhongThiID);

CREATE INDEX IX_DiemDanh_KyThiID ON dbo.DiemDanh(KyThiID);
CREATE INDEX IX_DiemDanh_PhongThiID ON dbo.DiemDanh(PhongThiID);
CREATE INDEX IX_DiemDanh_KyThi_PhongThi_TrangThai ON dbo.DiemDanh(KyThiID, PhongThiID, TrangThai);

CREATE INDEX IX_NhatKy_LoaiDoiTuong_DoiTuongID
ON dbo.NhatKy(LoaiDoiTuong, DoiTuongID);
GO

/* =========================================================
   REPORTING VIEWS - MB.01 -> MB.04
========================================================= */

CREATE OR ALTER VIEW dbo.vw_MB01_DanhSachSinhVienDangKyThi
AS
SELECT
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    mt.MaMon,
    mt.TenMon,
    kt.NgayThi,
    kt.GioBatDau,
    kt.GioKetThuc,
    kt.ThoiHanDangKyDen,
    dkt.DangKyThiID,
    sv.MaSinhVien,
    sv.HoTen,
    sv.Lop,
    dkt.SoBaoDanh,
    dkt.TrangThaiDangKy,
    dkt.NgayDangKy
FROM dbo.DangKyThi dkt
JOIN dbo.KyThi kt ON dkt.KyThiID = kt.KyThiID
JOIN dbo.MonThi mt ON kt.MonThiID = mt.MonThiID
JOIN dbo.SinhVien sv ON dkt.SinhVienID = sv.SinhVienID;
GO

CREATE OR ALTER VIEW dbo.vw_MB02_PhieuPhanPhongThi
AS
SELECT
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    mt.MaMon,
    mt.TenMon,
    kt.NgayThi,
    dkt.DangKyThiID,
    dkt.SoBaoDanh,
    sv.MaSinhVien,
    sv.HoTen,
    sv.Lop,
    pt.PhongThiID,
    pt.MaPhong,
    pt.TenPhong,
    pt.ToaNha,
    pt.Tang,
    pt.SucChua,
    pp.NguoiPhanID,
    nd.HoTen AS TenNguoiPhan,
    pp.ThoiDiemPhan
FROM dbo.PhanPhong pp
JOIN dbo.DangKyThi dkt ON pp.DangKyThiID = dkt.DangKyThiID
JOIN dbo.KyThi kt ON pp.KyThiID = kt.KyThiID
JOIN dbo.MonThi mt ON kt.MonThiID = mt.MonThiID
JOIN dbo.SinhVien sv ON dkt.SinhVienID = sv.SinhVienID
JOIN dbo.PhongThi pt ON pp.PhongThiID = pt.PhongThiID
LEFT JOIN dbo.NguoiDung nd ON pp.NguoiPhanID = nd.NguoiDungID;
GO

CREATE OR ALTER VIEW dbo.vw_MB03_SoDoXepChoNgoi
AS
SELECT
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    kt.NgayThi,
    pt.PhongThiID,
    pt.MaPhong,
    pt.TenPhong,
    pt.ToaNha,
    pt.Tang,
    pt.SoHang,
    pt.SoCot,
    dkt.SoBaoDanh,
    sv.MaSinhVien,
    sv.HoTen,
    sv.Lop,
    xc.SoCho,
    xc.Hang,
    xc.Cot,
    xc.ThoiDiemXep
FROM dbo.XepCho xc
JOIN dbo.DangKyThi dkt ON xc.DangKyThiID = dkt.DangKyThiID
JOIN dbo.KyThi kt ON xc.KyThiID = kt.KyThiID
JOIN dbo.SinhVien sv ON dkt.SinhVienID = sv.SinhVienID
JOIN dbo.PhongThi pt ON xc.PhongThiID = pt.PhongThiID;
GO

CREATE OR ALTER VIEW dbo.vw_MB04_BangDiemDanh
AS
SELECT
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    mt.MaMon,
    mt.TenMon,
    kt.NgayThi,
    kt.GioBatDau,
    kt.GioKetThuc,
    pt.PhongThiID,
    pt.MaPhong,
    pt.TenPhong,
    dkt.SoBaoDanh,
    sv.MaSinhVien,
    sv.HoTen,
    sv.Lop,
    xc.SoCho,
    dd.TrangThai,
    dd.ThoiGianCheckIn,
    dd.NguoiGhiNhanID,
    nd.HoTen AS TenNguoiGhiNhan,
    dd.GhiChu
FROM dbo.DiemDanh dd
JOIN dbo.DangKyThi dkt ON dd.DangKyThiID = dkt.DangKyThiID
JOIN dbo.KyThi kt ON dd.KyThiID = kt.KyThiID
JOIN dbo.MonThi mt ON kt.MonThiID = mt.MonThiID
JOIN dbo.SinhVien sv ON dkt.SinhVienID = sv.SinhVienID
JOIN dbo.PhongThi pt ON dd.PhongThiID = pt.PhongThiID
LEFT JOIN dbo.XepCho xc ON dd.DangKyThiID = xc.DangKyThiID
LEFT JOIN dbo.NguoiDung nd ON dd.NguoiGhiNhanID = nd.NguoiDungID;
GO

CREATE OR ALTER VIEW dbo.vw_TongHopDiemDanh
AS
SELECT
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    pt.PhongThiID,
    pt.MaPhong,
    pt.TenPhong,
    COUNT(*) AS TongSoSinhVien,
    SUM(CASE WHEN dd.TrangThai = N'present' THEN 1 ELSE 0 END) AS SoCoMat,
    SUM(CASE WHEN dd.TrangThai = N'absent' THEN 1 ELSE 0 END) AS SoVang,
    SUM(CASE WHEN dd.TrangThai = N'late' THEN 1 ELSE 0 END) AS SoDenMuon,
    SUM(CASE WHEN dd.TrangThai = N'excused' THEN 1 ELSE 0 END) AS SoCoPhep
FROM dbo.DiemDanh dd
JOIN dbo.KyThi kt ON dd.KyThiID = kt.KyThiID
JOIN dbo.PhongThi pt ON dd.PhongThiID = pt.PhongThiID
GROUP BY
    kt.KyThiID,
    kt.MaKyThi,
    kt.TenKyThi,
    pt.PhongThiID,
    pt.MaPhong,
    pt.TenPhong;
GO

/* =========================================================
   SEED DATA - VAI TRO
========================================================= */
INSERT INTO dbo.VaiTro (TenVaiTro)
VALUES
    (N'Admin'),
    (N'CanBoDaoTao'),
    (N'CanBoKhaoThi'),
    (N'SinhVien');
GO

/* =========================================================
   SEED DATA - NGUOI DUNG
========================================================= */
INSERT INTO dbo.NguoiDung (Email, MatKhauHash, HoTen, VaiTroID, TrangThai)
VALUES
    (N'admin@exam.local',     N'hashed_admin_password',       N'Quan tri he thong',      1, 1),
    (N'daotao01@exam.local',  N'hashed_daotao_password',      N'Can bo dao tao',         2, 1),
    (N'khaothi01@exam.local', N'hashed_khaothi_password',     N'Can bo khao thi',        3, 1),
    (N'sv001@exam.local',     N'hashed_student_password',     N'Nguyen Van A',           4, 1),
    (N'sv002@exam.local',     N'hashed_student_password',     N'Tran Thi B',             4, 1);
GO

/* =========================================================
   SEED DATA - SINH VIEN
========================================================= */
INSERT INTO dbo.SinhVien (MaSinhVien, HoTen, Lop, Email, DienThoai, TrangThai, NguoiDungID)
VALUES
    (N'SV001', N'Nguyen Van A', N'CTK44', N'sv001@exam.local', N'0901000001', 1, 4),
    (N'SV002', N'Tran Thi B',   N'CTK44', N'sv002@exam.local', N'0901000002', 1, 5),
    (N'SV003', N'Le Van C',     N'CTK45', N'sv003@exam.local', N'0901000003', 1, NULL),
    (N'SV004', N'Pham Thi D',   N'CTK45', N'sv004@exam.local', N'0901000004', 1, NULL);
GO

/* =========================================================
   SEED DATA - MON THI
========================================================= */
INSERT INTO dbo.MonThi (MaMon, TenMon)
VALUES
    (N'MON001', N'Co so du lieu'),
    (N'MON002', N'Lap trinh Web'),
    (N'MON003', N'Phan tich thiet ke he thong');
GO

/* =========================================================
   SEED DATA - PHONG THI
========================================================= */
INSERT INTO dbo.PhongThi (MaPhong, TenPhong, ToaNha, Tang, SucChua, SoHang, SoCot, TrangThai)
VALUES
    (N'A101', N'Phong A101', N'Toa A', 1, 40, 8, 5, 1),
    (N'A102', N'Phong A102', N'Toa A', 1, 40, 8, 5, 1),
    (N'B201', N'Phong B201', N'Toa B', 2, 60, 10, 6, 1);
GO

/* =========================================================
   SEED DATA - KY THI
========================================================= */
INSERT INTO dbo.KyThi (
    MaKyThi,
    TenKyThi,
    MonThiID,
    NgayThi,
    GioBatDau,
    GioKetThuc,
    ThoiHanDangKyDen,
    TrangThai,
    MoTa
)
VALUES
    (
        N'KT001',
        N'Ky thi Cuoi ky Co so du lieu',
        1,
        '2026-06-15',
        '07:30:00',
        '09:30:00',
        '2026-06-14T23:59:59',
        N'published',
        N'Ca thi sang'
    ),
    (
        N'KT002',
        N'Ky thi Cuoi ky Lap trinh Web',
        2,
        '2026-06-16',
        '13:30:00',
        '15:30:00',
        '2026-06-15T23:59:59',
        N'draft',
        N'Ca thi chieu'
    );
GO

/* =========================================================
   SEED DATA - DANG KY THI
========================================================= */
INSERT INTO dbo.DangKyThi (KyThiID, SinhVienID, SoBaoDanh, TrangThaiDangKy, NgayDangKy)
VALUES
    (1, 1, N'SBD001', N'registered', '2026-06-10T08:00:00'),
    (1, 2, N'SBD002', N'registered', '2026-06-10T08:05:00'),
    (1, 3, N'SBD003', N'registered', '2026-06-10T08:10:00'),
    (1, 4, N'SBD004', N'registered', '2026-06-10T08:15:00');
GO

/* =========================================================
   SEED DATA - PHAN PHONG
========================================================= */
INSERT INTO dbo.PhanPhong (DangKyThiID, KyThiID, PhongThiID, NguoiPhanID, ThoiDiemPhan)
VALUES
    (1, 1, 1, 3, '2026-06-05T07:43:14'),
    (2, 1, 1, 3, '2026-06-05T07:43:14'),
    (3, 1, 2, 3, '2026-06-05T07:43:14'),
    (4, 1, 2, 3, '2026-06-05T07:43:14');
GO

/* =========================================================
   SEED DATA - XEP CHO
========================================================= */
INSERT INTO dbo.XepCho (DangKyThiID, KyThiID, PhongThiID, SoCho, Hang, Cot, ThoiDiemXep)
VALUES
    (1, 1, 1, N'A01', 1, 1, '2026-06-05T07:43:14'),
    (2, 1, 1, N'A02', 1, 2, '2026-06-05T07:43:14'),
    (3, 1, 2, N'A01', 1, 1, '2026-06-05T07:43:14'),
    (4, 1, 2, N'A02', 1, 2, '2026-06-05T07:43:14');
GO

/* =========================================================
   SEED DATA - DIEM DANH
========================================================= */
INSERT INTO dbo.DiemDanh (
    DangKyThiID,
    KyThiID,
    PhongThiID,
    TrangThai,
    ThoiGianCheckIn,
    NguoiGhiNhanID,
    GhiChu
)
VALUES
    (1, 1, 1, N'present', '2026-06-15T07:10:00', 3, N'Da co mat'),
    (2, 1, 1, N'late',    '2026-06-15T07:40:00', 3, N'Den muon 10 phut'),
    (3, 1, 2, N'present', '2026-06-15T07:12:00', 3, N'Da co mat'),
    (4, 1, 2, N'absent',  NULL,                  3, N'Vang mat');
GO

/* =========================================================
   SEED DATA - NHAT KY
========================================================= */
INSERT INTO dbo.NhatKy (NguoiDungID, HanhDong, LoaiDoiTuong, DoiTuongID, MoTa)
VALUES
    (2, N'TAO_KY_THI', N'KyThi',     1, N'Tao ky thi KT001'),
    (3, N'PHAN_PHONG', N'PhanPhong', 1, N'Phan phong cho sinh vien SBD001 vao A101'),
    (3, N'XEP_CHO',    N'XepCho',    1, N'Xep cho A01 cho sinh vien SBD001'),
    (3, N'DIEM_DANH',  N'DiemDanh',  1, N'Ghi nhan sinh vien SBD001 co mat');
GO

/* =========================================================
   SANITY CHECKS
   Expected result: all three queries return empty result sets
========================================================= */

SELECT pp.*
FROM dbo.PhanPhong pp
JOIN dbo.DangKyThi dkt ON pp.DangKyThiID = dkt.DangKyThiID
WHERE pp.KyThiID <> dkt.KyThiID;

SELECT xc.*
FROM dbo.XepCho xc
LEFT JOIN dbo.PhanPhong pp
    ON xc.DangKyThiID = pp.DangKyThiID
   AND xc.KyThiID = pp.KyThiID
   AND xc.PhongThiID = pp.PhongThiID
WHERE pp.PhanPhongID IS NULL;

SELECT dd.*
FROM dbo.DiemDanh dd
LEFT JOIN dbo.PhanPhong pp
    ON dd.DangKyThiID = pp.DangKyThiID
   AND dd.KyThiID = pp.KyThiID
   AND dd.PhongThiID = pp.PhongThiID
WHERE pp.PhanPhongID IS NULL;
GO

/* =========================================================
   VIEW TESTS
========================================================= */
SELECT * FROM dbo.vw_MB01_DanhSachSinhVienDangKyThi;
SELECT * FROM dbo.vw_MB02_PhieuPhanPhongThi;
SELECT * FROM dbo.vw_MB03_SoDoXepChoNgoi;
SELECT * FROM dbo.vw_MB04_BangDiemDanh;
SELECT * FROM dbo.vw_TongHopDiemDanh;
GO
