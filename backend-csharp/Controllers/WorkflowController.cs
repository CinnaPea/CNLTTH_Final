using System.Text.Json;
using backend_csharp.Data;
using backend_csharp.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend_csharp.Controllers;

[Route("api/v1/ky_thi/{id:int}")]
public class WorkflowController(ExamDbContext dbContext) : ApiControllerBase
{
    [HttpPost("auto_phan_phong")]
    public async Task<IActionResult> AutoPhanPhong(
        int id,
        [FromQuery(Name = "nguoi_phan_id")] int? nguoiPhanQueryID,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] JsonElement? body = null)
    {
        KyThi? kyThi = await dbContext.KyThi.FindAsync(id);
        if (kyThi is null)
        {
            return NotFound(Error("Exam not found."));
        }

        if (kyThi.TrangThai != "published")
        {
            return UnprocessableEntity(new { error = "Only published exams can be assigned to rooms.", current_status = kyThi.TrangThai });
        }

        int? nguoiPhanID = nguoiPhanQueryID ?? ReadOptionalInt(body, "nguoi_phan_id");
        List<int> assignedIds = await dbContext.PhanPhong
            .Where(record => record.KyThiID == kyThi.KyThiID)
            .Select(record => record.DangKyThiID)
            .ToListAsync();

        List<DangKyThi> registrations = await dbContext.DangKyThi
            .Where(record => record.KyThiID == kyThi.KyThiID && record.TrangThaiDangKy == "registered" && !assignedIds.Contains(record.DangKyThiID))
            .OrderBy(record => record.DangKyThiID)
            .ToListAsync();

        if (registrations.Count == 0)
        {
            return Ok(new { message = "No unassigned registrations found.", created = 0 });
        }

        List<PhongThi> rooms = await dbContext.PhongThi.Where(record => record.TrangThai).OrderBy(record => record.PhongThiID).ToListAsync();
        if (rooms.Count == 0)
        {
            return UnprocessableEntity(Error("No active rooms found."));
        }

        Dictionary<int, int> roomUsage = await dbContext.PhanPhong
            .Where(record => record.KyThiID == kyThi.KyThiID)
            .GroupBy(record => record.PhongThiID)
            .Select(group => new { PhongThiID = group.Key, Count = group.Count() })
            .ToDictionaryAsync(item => item.PhongThiID, item => item.Count);

        List<PhanPhong> created = [];

        await using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync();
        foreach (DangKyThi registration in registrations)
        {
            PhongThi? selectedRoom = rooms.FirstOrDefault(room => roomUsage.GetValueOrDefault(room.PhongThiID) < room.SucChua);
            if (selectedRoom is null)
            {
                await transaction.RollbackAsync();
                return UnprocessableEntity(new { error = "Not enough room capacity for all registrations.", required = registrations.Count, created = created.Count });
            }

            PhanPhong assignment = new()
            {
                DangKyThiID = registration.DangKyThiID,
                KyThiID = kyThi.KyThiID,
                PhongThiID = selectedRoom.PhongThiID,
                NguoiPhanID = nguoiPhanID
            };

            dbContext.PhanPhong.Add(assignment);
            created.Add(assignment);
            roomUsage[selectedRoom.PhongThiID] = roomUsage.GetValueOrDefault(selectedRoom.PhongThiID) + 1;
        }

        kyThi.TrangThai = "room_assigned";
        kyThi.CapNhatLuc = DateTime.Now;

        try
        {
            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            await transaction.RollbackAsync();
            return Conflict(Error(exception.InnerException?.Message ?? exception.Message));
        }

        return Ok(new { message = "Auto room assignment completed.", created = created.Count, ky_thi = kyThi });
    }

    [HttpPost("auto_xep_cho")]
    public async Task<IActionResult> AutoXepCho(int id)
    {
        KyThi? kyThi = await dbContext.KyThi.FindAsync(id);
        if (kyThi is null)
        {
            return NotFound(Error("Exam not found."));
        }

        if (kyThi.TrangThai != "room_assigned")
        {
            return UnprocessableEntity(new { error = "Only room-assigned exams can be seated.", current_status = kyThi.TrangThai });
        }

        List<int> seatedIds = await dbContext.XepCho.Where(record => record.KyThiID == kyThi.KyThiID).Select(record => record.DangKyThiID).ToListAsync();
        List<PhanPhong> assignments = await dbContext.PhanPhong
            .Include(record => record.PhongThi)
            .Where(record => record.KyThiID == kyThi.KyThiID && !seatedIds.Contains(record.DangKyThiID))
            .OrderBy(record => record.PhongThiID)
            .ThenBy(record => record.PhanPhongID)
            .ToListAsync();

        if (assignments.Count == 0)
        {
            return Ok(new { message = "No unseated room assignments found.", created = 0 });
        }

        List<XepCho> created = [];

        await using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync();
        foreach (IGrouping<int, PhanPhong> roomAssignments in assignments.GroupBy(record => record.PhongThiID))
        {
            PhongThi? room = roomAssignments.First().PhongThi;
            int maxColumns = room?.SoCot is > 0 ? room.SoCot.Value : 5;

            HashSet<(int? Hang, int? Cot)> usedPositions = await dbContext.XepCho
                .Where(record => record.KyThiID == kyThi.KyThiID && record.PhongThiID == roomAssignments.Key)
                .Select(record => new ValueTuple<int?, int?>(record.Hang, record.Cot))
                .ToHashSetAsync();

            int nextIndex = 0;
            foreach (PhanPhong assignment in roomAssignments)
            {
                while (true)
                {
                    int hang = (nextIndex / maxColumns) + 1;
                    int cot = (nextIndex % maxColumns) + 1;
                    nextIndex++;

                    if (usedPositions.Contains((hang, cot)))
                    {
                        continue;
                    }

                    XepCho seat = new()
                    {
                        DangKyThiID = assignment.DangKyThiID,
                        KyThiID = assignment.KyThiID,
                        PhongThiID = assignment.PhongThiID,
                        SoCho = $"H{hang}-C{cot}",
                        Hang = hang,
                        Cot = cot
                    };

                    dbContext.XepCho.Add(seat);
                    created.Add(seat);
                    usedPositions.Add((hang, cot));
                    break;
                }
            }
        }

        kyThi.TrangThai = "seat_assigned";
        kyThi.CapNhatLuc = DateTime.Now;

        try
        {
            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            await transaction.RollbackAsync();
            return Conflict(Error(exception.InnerException?.Message ?? exception.Message));
        }

        return Ok(new { message = "Auto seating completed.", created = created.Count, ky_thi = kyThi });
    }

    [HttpPost("open_diem_danh")]
    public async Task<IActionResult> OpenDiemDanh(
        int id,
        [FromQuery(Name = "nguoi_ghi_nhan_id")] int? nguoiGhiNhanQueryID,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] JsonElement? body = null)
    {
        KyThi? kyThi = await dbContext.KyThi.FindAsync(id);
        if (kyThi is null)
        {
            return NotFound(Error("Exam not found."));
        }

        if (kyThi.TrangThai != "seat_assigned")
        {
            return UnprocessableEntity(new { error = "Only seated exams can open attendance.", current_status = kyThi.TrangThai });
        }

        int? nguoiGhiNhanID = nguoiGhiNhanQueryID ?? ReadOptionalInt(body, "nguoi_ghi_nhan_id");
        List<int> attendanceIds = await dbContext.DiemDanh.Where(record => record.KyThiID == kyThi.KyThiID).Select(record => record.DangKyThiID).ToListAsync();
        List<XepCho> seats = await dbContext.XepCho
            .Where(record => record.KyThiID == kyThi.KyThiID && !attendanceIds.Contains(record.DangKyThiID))
            .OrderBy(record => record.PhongThiID)
            .ThenBy(record => record.XepChoID)
            .ToListAsync();

        if (seats.Count == 0)
        {
            return Ok(new { message = "No seated registrations need attendance records.", created = 0 });
        }

        List<DiemDanh> created = [];
        await using Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction = await dbContext.Database.BeginTransactionAsync();
        foreach (XepCho seat in seats)
        {
            DiemDanh attendance = new()
            {
                DangKyThiID = seat.DangKyThiID,
                KyThiID = seat.KyThiID,
                PhongThiID = seat.PhongThiID,
                TrangThai = "absent",
                ThoiGianCheckIn = null,
                NguoiGhiNhanID = nguoiGhiNhanID,
                GhiChu = "Auto-created when attendance opened"
            };

            dbContext.DiemDanh.Add(attendance);
            created.Add(attendance);
        }

        kyThi.TrangThai = "attendance_open";
        kyThi.CapNhatLuc = DateTime.Now;

        try
        {
            await dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch (DbUpdateException exception) when (IsDatabaseConflict(exception))
        {
            await transaction.RollbackAsync();
            return Conflict(Error(exception.InnerException?.Message ?? exception.Message));
        }

        return Ok(new { message = "Attendance opened.", created = created.Count, ky_thi = kyThi });
    }

    private static int? ReadOptionalInt(JsonElement? body, string propertyName)
    {
        if (!body.HasValue || body.Value.ValueKind != JsonValueKind.Object || !body.Value.TryGetProperty(propertyName, out JsonElement property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out int value) ? value : null;
    }
}
