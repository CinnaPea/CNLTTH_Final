require "set"
class Api::V1::WorkflowController < ApplicationController
  def auto_phan_phong
    ky_thi = KyThi.find(params[:id])

    unless ky_thi.TrangThai == "published"
      return render json: {
        error: "Only published exams can be assigned to rooms.",
        current_status: ky_thi.TrangThai
      }, status: :unprocessable_entity
    end

    registrations = DangKyThi
                    .where(KyThiID: ky_thi.KyThiID, TrangThaiDangKy: "registered")
                    .where.not(
                      DangKyThiID: PhanPhong.where(KyThiID: ky_thi.KyThiID).select(:DangKyThiID)
                    )
                    .order(DangKyThiID: :asc)

    if registrations.empty?
      return render json: {
        message: "No unassigned registrations found.",
        created: 0
      }
    end

    rooms = PhongThi.where(TrangThai: true).order(PhongThiID: :asc)

    if rooms.empty?
      return render json: { error: "No active rooms found." }, status: :unprocessable_entity
    end

    room_usage = PhanPhong
                 .where(KyThiID: ky_thi.KyThiID)
                 .group(:PhongThiID)
                 .count

    created = []

    ActiveRecord::Base.transaction do
      registrations.each do |registration|
        selected_room = rooms.find do |room|
          used = room_usage[room.PhongThiID] || 0
          used < room.SucChua
        end

        unless selected_room
          raise ActiveRecord::Rollback
        end

        created << PhanPhong.create!(
          DangKyThiID: registration.DangKyThiID,
          KyThiID: ky_thi.KyThiID,
          PhongThiID: selected_room.PhongThiID,
          NguoiPhanID: params[:nguoi_phan_id]
        )

        room_usage[selected_room.PhongThiID] ||= 0
        room_usage[selected_room.PhongThiID] += 1
      end

      ky_thi.update!(TrangThai: "room_assigned")
    end

    if created.length != registrations.length
      return render json: {
        error: "Not enough room capacity for all registrations.",
        required: registrations.length,
        created: created.length
      }, status: :unprocessable_entity
    end

    render json: {
      message: "Auto room assignment completed.",
      created: created.length,
      ky_thi: ky_thi.reload
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exam not found." }, status: :not_found
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique => e
    render json: { error: e.message }, status: :conflict
  end

  def auto_xep_cho
    ky_thi = KyThi.find(params[:id])

    unless ky_thi.TrangThai == "room_assigned"
      return render json: {
        error: "Only room-assigned exams can be seated.",
        current_status: ky_thi.TrangThai
      }, status: :unprocessable_entity
    end

    assignments = PhanPhong
                  .where(KyThiID: ky_thi.KyThiID)
                  .where.not(
                    DangKyThiID: XepCho.where(KyThiID: ky_thi.KyThiID).select(:DangKyThiID)
                  )
                  .includes(:phong_thi)
                  .order(:PhongThiID, :PhanPhongID)

    if assignments.empty?
      return render json: {
        message: "No unseated room assignments found.",
        created: 0
      }
    end

    created = []

    ActiveRecord::Base.transaction do
      assignments.group_by(&:PhongThiID).each do |phong_thi_id, room_assignments|
        room = room_assignments.first.phong_thi
        max_columns = room.SoCot.presence || 5

        used_positions = XepCho
                         .where(KyThiID: ky_thi.KyThiID, PhongThiID: phong_thi_id)
                         .pluck(:Hang, :Cot)
                         .to_set

        next_index = 0

        room_assignments.each do |assignment|
          loop do
            hang = (next_index / max_columns) + 1
            cot = (next_index % max_columns) + 1
            next_index += 1

            next if used_positions.include?([hang, cot])

            so_cho = "H#{hang}-C#{cot}"

            created << XepCho.create!(
              DangKyThiID: assignment.DangKyThiID,
              KyThiID: assignment.KyThiID,
              PhongThiID: assignment.PhongThiID,
              SoCho: so_cho,
              Hang: hang,
              Cot: cot
            )

            used_positions.add([hang, cot])
            break
          end
        end
      end

      ky_thi.update!(TrangThai: "seat_assigned")
    end

    render json: {
      message: "Auto seating completed.",
      created: created.length,
      ky_thi: ky_thi.reload
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exam not found." }, status: :not_found
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique => e
    render json: { error: e.message }, status: :conflict
  end

  def open_diem_danh
    ky_thi = KyThi.find(params[:id])

    unless ky_thi.TrangThai == "seat_assigned"
      return render json: {
        error: "Only seated exams can open attendance.",
        current_status: ky_thi.TrangThai
      }, status: :unprocessable_entity
    end

    seats = XepCho
            .where(KyThiID: ky_thi.KyThiID)
            .where.not(
              DangKyThiID: DiemDanh.where(KyThiID: ky_thi.KyThiID).select(:DangKyThiID)
            )
            .order(:PhongThiID, :XepChoID)

    if seats.empty?
      return render json: {
        message: "No seated registrations need attendance records.",
        created: 0
      }
    end

    created = []

    ActiveRecord::Base.transaction do
      seats.each do |seat|
        created << DiemDanh.create!(
          DangKyThiID: seat.DangKyThiID,
          KyThiID: seat.KyThiID,
          PhongThiID: seat.PhongThiID,
          TrangThai: "absent",
          ThoiGianCheckIn: nil,
          NguoiGhiNhanID: params[:nguoi_ghi_nhan_id],
          GhiChu: "Auto-created when attendance opened"
        )
      end

      ky_thi.update!(TrangThai: "attendance_open")
    end

    render json: {
      message: "Attendance opened.",
      created: created.length,
      ky_thi: ky_thi.reload
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Exam not found." }, status: :not_found
  rescue ActiveRecord::RecordInvalid, ActiveRecord::RecordNotUnique => e
    render json: { error: e.message }, status: :conflict
  end
end