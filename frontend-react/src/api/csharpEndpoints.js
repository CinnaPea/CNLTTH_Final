import { csharpAPI } from "./client";

export const csharpEndpoints = {
    health() {
        return csharpAPI.get("/health");
    },
    login(payload) {
        return csharpAPI.post("/auth/login", payload);
    },
    signup(payload) {
        return csharpAPI.post("/auth/signup", payload);
    },
    getNguoiDung() {
        return csharpAPI.get("/nguoi_dung");
    },
    getNguoiDungById(id) {
        return csharpAPI.get(`/nguoi_dung/${id}`);
    },
    createNguoiDung(payload) {
        return csharpAPI.post("/nguoi_dung", { nguoi_dung: payload });
    },
    updateNguoiDung(id, payload) {
        return csharpAPI.patch(`/nguoi_dung/${id}`, { nguoi_dung: payload });
    },
    deleteNguoiDung(id) {
        return csharpAPI.delete(`/nguoi_dung/${id}`);
    },
    getVaiTro() {
        return csharpAPI.get("/vai_tro");
    },
    getMonThi() {
        return csharpAPI.get("/mon_thi");
    },
    createMonThi(payload) {
        return csharpAPI.post("/mon_thi", { mon_thi: payload });
    },
    updateMonThi(id, payload) {
        return csharpAPI.patch(`/mon_thi/${id}`, { mon_thi: payload });
    },
    deleteMonThi(id) {
        return csharpAPI.delete(`/mon_thi/${id}`);
    },
    getSinhVien() {
        return csharpAPI.get("/sinh_vien");
    },
    createSinhVien(payload) {
        return csharpAPI.post("/sinh_vien", { sinh_vien: payload });
    },
    updateSinhVien(id, payload) {
        return csharpAPI.patch(`/sinh_vien/${id}`, { sinh_vien: payload });
    },
    deleteSinhVien(id) {
        return csharpAPI.delete(`/sinh_vien/${id}`);
    },
    getPhong() {
        return csharpAPI.get("/phong_thi");
    },
    createPhong(payload) {
        return csharpAPI.post("/phong_thi", { phong_thi: payload });
    },
    updatePhong(id, payload) {
        return csharpAPI.patch(`/phong_thi/${id}`, { phong_thi: payload });
    },
    deletePhong(id) {
        return csharpAPI.delete(`/phong_thi/${id}`);
    },
    getKyThis() {
        return csharpAPI.get("/ky_thi");
    },
    getKyThi(id) {
        return csharpAPI.get(`/ky_thi/${id}`);
    },
    createKyThi(payload) {
        return csharpAPI.post("/ky_thi", { ky_thi: payload });
    },
    updateKyThi(id, payload) {
        return csharpAPI.patch(`/ky_thi/${id}`, { ky_thi: payload });
    },
    deleteKyThi(id) {
        return csharpAPI.delete(`/ky_thi/${id}`);
    },
    publishKyThi(id) {
        return csharpAPI.patch(`/ky_thi/${id}/publish`);
    },
    closeKyThi(id) {
        return csharpAPI.patch(`/ky_thi/${id}/close`);
    },
    getDangKy() {
        return csharpAPI.get("/dang_ky_thi");
    },
    createDangKy(payload) {
        return csharpAPI.post("/dang_ky_thi", { dang_ky_thi: payload });
    },
    updateDangKy(id, payload) {
        return csharpAPI.patch(`/dang_ky_thi/${id}`, { dang_ky_thi: payload });
    },
    deleteDangKy(id) {
        return csharpAPI.delete(`/dang_ky_thi/${id}`);
    },
    cancelDangKy(id) {
        return csharpAPI.patch(`/dang_ky_thi/${id}/cancel`);
    },
    getPhanPhong() {
        return csharpAPI.get("/phan_phong");
    },
    deletePhanPhong(id) {
        return csharpAPI.delete(`/phan_phong/${id}`);
    },
    autoPhanPhong(kyThiId, nguoiPhanId = null) {
        const query = nguoiPhanId ? `?nguoi_phan_id=${nguoiPhanId}` : "";
        return csharpAPI.post(`/ky_thi/${kyThiId}/auto_phan_phong${query}`);
    },
    getXepCho() {
        return csharpAPI.get("/xep_cho");
    },
    createXepCho(payload) {
        return csharpAPI.post("/xep_cho", { xep_cho: payload });
    },
    deleteXepCho(id) {
        return csharpAPI.delete(`/xep_cho/${id}`);
    },
    autoXepCho(kyThiId) {
        return csharpAPI.post(`/ky_thi/${kyThiId}/auto_xep_cho`);
    },
    getDiemDanh() {
        return csharpAPI.get("/diem_danh");
    },
    openDiemDanh(kyThiId, nguoiGhiNhanId = null) {
        const query = nguoiGhiNhanId ? `?nguoi_ghi_nhan_id=${nguoiGhiNhanId}` : "";
        return csharpAPI.post(`/ky_thi/${kyThiId}/open_diem_danh${query}`);
    },
    updateDiemDanh(id, payload) {
        return csharpAPI.patch(`/diem_danh/${id}`, { diem_danh: payload });
    },
};
