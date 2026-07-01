import {
    rubyAPI
} from "./client";

function getSessionUserHeaders() {
    try {
        const session = JSON.parse(localStorage.getItem("examflow.auth.session") || "null");
        const userId = session?.user?.NguoiDungID;
        return userId ? { "X-User-Id": String(userId) } : {};
    } catch {
        return {};
    }
}

function queryString(params) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if(value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const text = query.toString();
    return text ? `?${text}` : "";
}

export const rubyEndpoints = {
    health() {
        return rubyAPI.get("/health");
    },
    login(payload) {
        return rubyAPI.post("/auth/login", payload);
    },
    signup(payload) {
        return rubyAPI.post("/auth/signup", payload);
    },
    getNguoiDung() {
        return rubyAPI.get("/nguoi_dung");
    },
    getNguoiDungById(id) {
        return rubyAPI.get(`/nguoi_dung/${id}`);
    },
    createNguoiDung(payload) {
        return rubyAPI.post("/nguoi_dung", { nguoi_dung: payload });
    },
    updateNguoiDung(id, payload) {
        return rubyAPI.patch(`/nguoi_dung/${id}`, { nguoi_dung: payload });
    },
    deleteNguoiDung(id) {
        return rubyAPI.delete(`/nguoi_dung/${id}`);
    },
    getVaiTro() {
        return rubyAPI.get("/vai_tro");
    },
    getNhatKy(params = {}) {
        return rubyAPI.get(`/nhat_ky${queryString(params)}`, { headers: getSessionUserHeaders() });
    },
    getNhatKyById(id) {
        return rubyAPI.get(`/nhat_ky/${id}`, { headers: getSessionUserHeaders() });
    },
    getMonThi() {
        return rubyAPI.get("/mon_thi");
    },
    createMonThi(payload) {
        return rubyAPI.post("/mon_thi", { mon_thi: payload });
    },
    updateMonThi(id, payload) {
        return rubyAPI.patch(`/mon_thi/${id}`, { mon_thi: payload });
    },
    deleteMonThi(id) {
        return rubyAPI.delete(`/mon_thi/${id}`);
    },
    getSinhVien() {
        return rubyAPI.get("/sinh_vien");
    },
    createSinhVien(payload) {
        return rubyAPI.post("/sinh_vien", { sinh_vien: payload });
    },
    updateSinhVien(id, payload) {
        return rubyAPI.patch(`/sinh_vien/${id}`, { sinh_vien: payload });
    },
    deleteSinhVien(id) {
        return rubyAPI.delete(`/sinh_vien/${id}`);
    },
    getPhong() {
        return rubyAPI.get("/phong_thi");
    },
    createPhong(payload) {
        return rubyAPI.post("/phong_thi", { phong_thi: payload });
    },
    updatePhong(id, payload) {
        return rubyAPI.patch(`/phong_thi/${id}`, { phong_thi: payload });
    },
    deletePhong(id) {
        return rubyAPI.delete(`/phong_thi/${id}`);
    },
    getKyThis() {
        return rubyAPI.get("/ky_thi");
    },
    getKyThi(id) {
        return rubyAPI.get(`/ky_thi/${id}`);
    },
    createKyThi(payload) {
        return rubyAPI.post("/ky_thi", { ky_thi: payload });
    },
    updateKyThi(id, payload) {
        return rubyAPI.patch(`/ky_thi/${id}`, { ky_thi: payload });
    },
    deleteKyThi(id) {
        return rubyAPI.delete(`/ky_thi/${id}`);
    },
    publishKyThi(id) {
        return rubyAPI.patch(`/ky_thi/${id}/publish`);
    },
    closeKyThi(id) {
        return rubyAPI.patch(`/ky_thi/${id}/close`);
    },
    getDangKy() {
        return rubyAPI.get("/dang_ky_thi");
    },
    createDangKy(payload) {
        return rubyAPI.post("/dang_ky_thi", { dang_ky_thi: payload });
    },
    updateDangKy(id, payload) {
        return rubyAPI.patch(`/dang_ky_thi/${id}`, { dang_ky_thi: payload });
    },
    deleteDangKy(id) {
        return rubyAPI.delete(`/dang_ky_thi/${id}`);
    },
    cancelDangKy(id) {
        return rubyAPI.patch(`/dang_ky_thi/${id}/cancel`);
    },
    getPhanPhong() {
        return rubyAPI.get("/phan_phong");
    },
    createPhanPhong(payload) {
        return rubyAPI.post("/phan_phong", { phan_phong: payload });
    },
    deletePhanPhong(id) {
        return rubyAPI.delete(`/phan_phong/${id}`);
    },
    autoPhanPhong(kyThiId, nguoiPhanId = null) {
        const query = nguoiPhanId ? `?nguoi_phan_id=${nguoiPhanId}` : "";
        return rubyAPI.post(`/ky_thi/${kyThiId}/auto_phan_phong${query}`);
    },
    getXepCho() {
        return rubyAPI.get("/xep_cho");
    },
    createXepCho(payload) {
        return rubyAPI.post("/xep_cho", { xep_cho: payload });
    },
    deleteXepCho(id) {
        return rubyAPI.delete(`/xep_cho/${id}`);
    },
    autoXepCho(kyThiId) {
        return rubyAPI.post(`/ky_thi/${kyThiId}/auto_xep_cho`);
    },
    getDiemDanh() {
        return rubyAPI.get("/diem_danh");
    },
    openDiemDanh(kyThiId, nguoiGhiNhanId = null) {
        const query = nguoiGhiNhanId ? `?nguoi_ghi_nhan_id=${nguoiGhiNhanId}` : "";
        return rubyAPI.post(`/ky_thi/${kyThiId}/open_diem_danh${query}`);    
    },
    updateDiemDanh(kyThiId, payload) {
        return rubyAPI.patch(`/diem_danh/${kyThiId}`, { diem_danh: payload });
    },
}
